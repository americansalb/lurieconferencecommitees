import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RETURNING_2024 } from "@/lib/returning-2024";
import { newAttendeeToken, buildAttendeeInvite } from "@/lib/attendees";
import { ensureFirstNameCode } from "@/lib/discounts";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// The 2024 roster: everyone who filled the first joint conference's form.
//
// POST { action: "load", discountPercent? }
//   Upserts the 501-person roster into the attendee pipeline. People we have
//   never emailed are created as fresh "queued" rows; people already on the
//   list (e.g. from the big alumni blast) are RE-TAGGED — inviteTemplate
//   becomes "returning" and the 2024 fields are set — but never duplicated,
//   and paid/declined/unsubscribed people are left alone.
//
// POST { action: "queue" }
//   Renders the personalized reunion letter for every returning-tagged person
//   who hasn't paid, declined, or unsubscribed, and drips them into the shared
//   paced Email Queue. Already-invited people simply get the reunion letter as
//   their next send (their status is untouched); never double-queues anyone
//   with a pending row.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;
  const body = await req.json().catch(() => ({}));
  const action = body?.action === "queue" ? "queue" : "load";

  if (action === "load") {
    const pct = Math.max(0, Math.min(100, Number.isFinite(body?.discountPercent) ? body.discountPercent : 25));
    let created = 0;
    let retagged = 0;
    let leftAlone = 0;
    for (const r of RETURNING_2024) {
      const email = r.email.trim().toLowerCase();
      const existing = await prisma.attendee.findUnique({ where: { email } });
      if (!existing) {
        const a = await prisma.attendee.create({
          data: {
            email,
            firstName: r.firstName,
            lastName: r.lastName,
            primaryLanguages: r.languages || null,
            returning2024: r.status2024,
            attended2024Mode: r.mode2024 || null,
            discountPercent: pct,
            inviteToken: newAttendeeToken(),
            inviteTemplate: "returning",
            status: "queued",
          },
        });
        await prisma.attendeeEvent.create({
          data: { attendeeId: a.id, type: "added_to_queue", meta: "2024 roster", actorEmail: adminEmail },
        }).catch(() => {});
        created++;
        continue;
      }
      // Already on the list. Never touch people who finished the story on
      // their own (paid this year), said no, or opted out.
      if (existing.paid || existing.status === "declined" || existing.unsubscribedAt || existing.isTest) {
        leftAlone++;
        continue;
      }
      await prisma.attendee.update({
        where: { id: existing.id },
        data: {
          inviteTemplate: "returning",
          returning2024: r.status2024,
          attended2024Mode: r.mode2024 || null,
          primaryLanguages: existing.primaryLanguages || r.languages || null,
        },
      });
      retagged++;
    }
    return NextResponse.json({ ok: true, created, retagged, leftAlone, total: RETURNING_2024.length });
  }

  // action === "queue": drip the reunion letter to everyone tagged returning.
  const targets = await prisma.attendee.findMany({
    where: {
      returning2024: { not: null },
      inviteTemplate: "returning",
      paid: false,
      isTest: false,
      unsubscribedAt: null,
      status: { notIn: ["declined", "registered", "rsvp_pending", "confirmed"] },
    },
  });
  if (!targets.length) return NextResponse.json({ ok: true, queued: 0, skipped: 0 });

  // Never double-queue anyone who already has a pending row.
  const already = await prisma.emailQueue.findMany({
    where: { recipientType: "attendee", status: "pending", recipientId: { in: targets.map((t) => t.id) } },
    select: { recipientId: true },
  });
  const has = new Set(already.map((r) => r.recipientId));
  const fresh = targets.filter((t) => !has.has(t.id));
  if (!fresh.length) return NextResponse.json({ ok: true, queued: 0, skipped: targets.length });

  // Their personal first-name code should also work on the public site.
  const seenNames = new Set<string>();
  for (const t of fresh) {
    const key = (t.firstName || "").toLowerCase();
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    await ensureFirstNameCode(t.firstName, t.discountPercent, adminEmail).catch(() => {});
  }

  const policy = await getPolicy();
  const times = await planSendTimes(fresh.length, policy);
  const batchId = `attendee-returning-${Date.now()}`;
  const rows = fresh.map((a, i) => {
    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
      returning: { status: a.returning2024, mode: a.attended2024Mode, languages: a.primaryLanguages },
    });
    return {
      batchId,
      recipientType: "attendee" as const,
      recipientId: a.id,
      to: a.email,
      subject,
      html,
      scheduledFor: times[i],
      status: "pending" as const,
    };
  });

  let queued = 0;
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await prisma.emailQueue.createMany({ data: rows.slice(i, i + BATCH) });
    queued += res.count;
  }
  await prisma.attendeeEvent
    .createMany({ data: fresh.map((a) => ({ attendeeId: a.id, type: "added_to_send_queue", meta: "2024 reunion", actorEmail: adminEmail })) })
    .catch(() => {});

  return NextResponse.json({ ok: true, queued, skipped: targets.length - fresh.length });
}
