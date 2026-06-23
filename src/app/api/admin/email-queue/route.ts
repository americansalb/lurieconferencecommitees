import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPaused, setPaused, getPolicy, savePolicy, queueEnvelope, afterQueueSend } from "@/lib/email-queue";
import { sendMail } from "@/lib/mail";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const [last24h, last1h] = await Promise.all([
    prisma.emailQueue.count({ where: { status: "sent", sentAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
    prisma.emailQueue.count({ where: { status: "sent", sentAt: { gte: new Date(Date.now() - 3600 * 1000) } } }),
  ]);

  return NextResponse.json({
    counts: counts.reduce<Record<string, number>>((acc, c) => ((acc[c.status] = c._count._all), acc), {}),
    nextScheduledFor: nextDue?.scheduledFor || null,
    sentLast24h: last24h,
    sentLastHour: last1h,
    policy,
    paused,
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
// (sends everything pending right now) — useful when no cron is wired up yet
// or you just want the batch out the door.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const force = body?.force === true;
  const limit = Math.min(200, Math.max(1, parseInt(body?.limit, 10) || 100));

  const where = force
    ? { status: "pending" }
    : { status: "pending", scheduledFor: { lte: new Date() } };

  const due = await prisma.emailQueue.findMany({
    where,
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  for (const item of due) {
    const claim = await prisma.emailQueue.updateMany({
      where: { id: item.id, status: "pending" },
      data: { status: "sending", attempts: { increment: 1 } },
    });
    if (claim.count === 0) continue;

    try {
      const result = await sendMail({
        to: item.to,
        subject: item.subject,
        html: item.html,
        text: item.textBody || undefined,
        ...queueEnvelope(item.recipientType),
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

  return NextResponse.json({ processed: due.length, sent, failed, forced: force });
}
