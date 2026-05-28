import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { isPaused } from "@/lib/email-queue";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const provided =
    req.headers.get("x-cron-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return provided === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return handle();
}
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return handle();
}

async function handle() {
  if (await isPaused()) {
    return NextResponse.json({ paused: true, processed: 0 });
  }

  const now = new Date();
  const due = await prisma.emailQueue.findMany({
    where: { status: "pending", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: 25, // conservative per-run cap
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
      });
      const resendId = (result as { id?: string })?.id || null;
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: { status: "sent", sentAt: new Date(), resendId },
      });
      if (item.recipientType === "attendee" && item.recipientId) {
        await prisma.attendee.updateMany({
          where: { id: item.recipientId, status: { in: ["queued"] } },
          data: { status: "invited", invitedAt: new Date(), lastSentAt: new Date() },
        });
        await prisma.attendee.updateMany({
          where: { id: item.recipientId, status: { notIn: ["queued"] } },
          data: { lastSentAt: new Date() },
        });
        await prisma.attendeeEvent.create({
          data: { attendeeId: item.recipientId, type: "invite_sent" },
        }).catch(() => {});
      }
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
  return NextResponse.json({ processed: due.length, sent, failed });
}
