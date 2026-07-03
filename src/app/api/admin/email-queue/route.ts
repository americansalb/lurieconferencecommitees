import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPaused, setPaused, getPolicy, savePolicy, queueEnvelope, afterQueueSend, runEmailQueue, estimateNextSend, prepareQueueDelivery } from "@/lib/email-queue";
import { sendMail } from "@/lib/mail";
import { buildAttendeeInvite } from "@/lib/attendees";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Opportunistic drain: send any items that are due right now, so the paced
  // queue keeps advancing on admin activity even if the external Render cron
  // isn't reaching the app. Fire-and-forget; runEmailQueue still respects the
  // pause flag, the hourly/daily caps, scheduled times, and claims each row
  // atomically, so it's safe to overlap with the cron and with itself.
  void runEmailQueue().catch((e) => console.error("[email-queue] opportunistic drain failed", e));

  const [counts, nextDue, policy, paused] = await Promise.all([
    prisma.emailQueue.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.emailQueue.findFirst({
      where: { status: "pending" },
      orderBy: { scheduledFor: "asc" },
      select: { scheduledFor: true },
    }),
    getPolicy(),
    isPaused(),
  ]);

  const [last24h, last1h, nextSend] = await Promise.all([
    prisma.emailQueue.count({ where: { status: "sent", sentAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
    prisma.emailQueue.count({ where: { status: "sent", sentAt: { gte: new Date(Date.now() - 3600 * 1000) } } }),
    // The honest "when will the next one actually leave", accounting for pacing,
    // caps, and the send window (not just the earliest raw scheduledFor).
    estimateNextSend(),
  ]);

  // The individual queued sends, so the dashboard can show who is waiting and
  // let an admin push any single one out now.
  const pending = await prisma.emailQueue.findMany({
    where: { status: "pending" },
    orderBy: { scheduledFor: "asc" },
    take: 500,
    select: { id: true, to: true, subject: true, scheduledFor: true, recipientType: true, recipientId: true, attempts: true },
  });

  // The sent log: what has already gone out (and what failed / was canceled or
  // skipped), most recent first, so admins can see the trail instead of just the
  // pending queue. updatedAt is set on every status transition.
  const recent = await prisma.emailQueue.findMany({
    where: { status: { in: ["sent", "failed", "canceled", "skipped"] } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, to: true, subject: true, recipientType: true, status: true, sentAt: true, updatedAt: true, attempts: true, lastError: true, resendId: true },
  });

  // Sponsors don't auto-enter the queue: a prospect only gets scheduled when
  // it's added to the background queue. Surface how many are still waiting so
  // this page (the one queue) can pull them all in, instead of them being
  // invisible over on the Sponsors dashboard. Mirrors the queue-pending filter.
  const sponsorProspects = await prisma.sponsor.count({
    where: { status: "prospect", mergedIntoId: null, unsubscribedAt: null },
  });

  // Ambassadors loaded on /ambassadors but not yet scheduled, surfaced here so
  // the queue page stays the one place everything sends from.
  const ambassadorsPending = await prisma.ambassador.count({
    where: { status: "pending", unsubscribedAt: null },
  });

  return NextResponse.json({
    counts: counts.reduce<Record<string, number>>((acc, c) => ((acc[c.status] = c._count._all), acc), {}),
    nextScheduledFor: nextDue?.scheduledFor || null,
    nextSend,
    sentLast24h: last24h,
    sentLastHour: last1h,
    policy,
    paused,
    pending,
    recent,
    sponsorProspects,
    ambassadorsPending,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (typeof body?.paused === "boolean") {
    await setPaused(body.paused);
  }
  const policy = body?.policy && typeof body.policy === "object" ? await savePolicy(body.policy) : await getPolicy();
  return NextResponse.json({ ok: true, policy, paused: await isPaused() });
}

// Admin-triggered queue flush. With { force: true } it ignores scheduledFor
// (sends everything pending right now), useful when no cron is wired up yet
// or you just want the batch out the door.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));

  // Queue a realistic test invite at the FRONT of the line (defaults to the
  // admin's own address) so the next release verifies the full pipeline.
  if (body?.action === "testEmail") {
    const to = (typeof body.to === "string" && body.to.trim()) ? body.to.trim() : (session?.user?.email || "");
    if (!isEmail(to)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    const { subject, html } = buildAttendeeInvite({ firstName: "Test", inviteToken: "TEST-PREVIEW", discountPercent: 25, inviteMessage: null, template: "standard" });
    await prisma.emailQueue.create({
      data: { batchId: "test", recipientType: "test", to, subject: `[TEST] ${subject}`, html, scheduledFor: new Date(Date.now() - 1000), status: "pending" },
    });
    return NextResponse.json({ ok: true, queuedTestTo: to });
  }

  // Test burst: move the next N pending items to the front and spread them
  // across the next few minutes so the background sender drips them out.
  if (body?.action === "burst") {
    const count = Math.min(50, Math.max(1, parseInt(body?.count, 10) || 5));
    const minutes = Math.min(60, Math.max(1, parseInt(body?.minutes, 10) || 2));
    const items = await prisma.emailQueue.findMany({
      where: { status: "pending" }, orderBy: { scheduledFor: "asc" }, take: count, select: { id: true },
    });
    const now = Date.now();
    const step = items.length > 1 ? (minutes * 60000) / (items.length - 1) : 0;
    for (let i = 0; i < items.length; i++) {
      await prisma.emailQueue.update({ where: { id: items[i].id }, data: { scheduledFor: new Date(now + Math.round(i * step)) } });
    }
    return NextResponse.json({ ok: true, bursting: items.length, minutes, paused: await isPaused() });
  }

  // Shuffle: keep the exact same set of scheduled send times (so pacing and the
  // overall window are untouched) but randomly reassign which pending recipient
  // gets which slot. Mixes up the order without re-queuing. Optionally scoped to
  // one recipientType so the sponsor and attendee queues shuffle independently.
  if (body?.action === "shuffle") {
    const recipientType = typeof body?.recipientType === "string" ? body.recipientType : null;
    const where = recipientType
      ? { status: "pending", recipientType }
      : { status: "pending" };
    const items = await prisma.emailQueue.findMany({
      where, select: { id: true, scheduledFor: true },
    });
    if (items.length < 2) return NextResponse.json({ ok: true, shuffled: items.length });
    const times = items.map((i) => i.scheduledFor).sort((a, b) => a.getTime() - b.getTime());
    const ids = items.map((i) => i.id);
    // Fisher-Yates over the ids; times stay in order, so the schedule is the
    // same but recipients are dealt into the slots at random.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    await prisma.$transaction(
      ids.map((id, idx) => prisma.emailQueue.update({ where: { id }, data: { scheduledFor: times[idx] } })),
    );
    return NextResponse.json({ ok: true, shuffled: ids.length, paused: await isPaused() });
  }

  // Cancel specific pending entries (the per-row "cancel" on the queue page).
  // Only affects rows that are still pending; sent/sending are left alone.
  if (body?.action === "cancel") {
    const cancelIds = Array.isArray(body?.ids)
      ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
      : null;
    if (!cancelIds || !cancelIds.length) {
      return NextResponse.json({ error: "Pass ids to cancel." }, { status: 400 });
    }
    const r = await prisma.emailQueue.updateMany({
      where: { status: "pending", id: { in: cancelIds } },
      data: { status: "canceled" },
    });
    return NextResponse.json({ ok: true, canceled: r.count });
  }

  // Specific entries to send right now (the "send this one" action), regardless
  // of their scheduled time. This is the only manual push left: invites should
  // always go out one or two at a time, never as a bulk blast. The old
  // { force: true } "send everything now" path has been removed on purpose.
  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : null;
  if (!ids || !ids.length) {
    return NextResponse.json(
      { error: "Pass specific ids to send. Bulk 'send everything now' is disabled; invites go out paced, a couple at a time." },
      { status: 400 },
    );
  }
  // Hard ceiling so even a hand-crafted request can only nudge a couple out.
  const limit = Math.min(5, ids.length);

  const where = { status: "pending", id: { in: ids } };

  const due = await prisma.emailQueue.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const item of due) {
    const claim = await prisma.emailQueue.updateMany({
      where: { id: item.id, status: "pending" },
      data: { status: "sending", attempts: { increment: 1 } },
    });
    if (claim.count === 0) continue;

    // Same suppression check + unsubscribe headers + CC as the cron path —
    // "send this one now" must not become the one door an opt-out slips through.
    const extras = await prepareQueueDelivery(item);
    if (extras.skip) { skipped++; continue; }

    try {
      const result = await sendMail({
        to: item.to,
        subject: item.subject,
        html: item.html,
        text: item.textBody || undefined,
        ...queueEnvelope(item.recipientType),
        cc: extras.cc,
        headers: extras.headers,
      });
      const resendId = (result as { id?: string })?.id || null;
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: { status: "sent", sentAt: new Date(), resendId },
      });
      await afterQueueSend(item);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = (e as { status?: number }).status;
      const giveUp = item.attempts >= 4 || (status && status >= 400 && status < 500);
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: giveUp ? "failed" : "pending",
          lastError: msg.slice(0, 500),
          scheduledFor: giveUp ? item.scheduledFor : new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      failed++;
    }
  }

  return NextResponse.json({ processed: due.length, sent, failed, skipped });
}
