import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dispatchToUser, PushChannel } from "@/lib/push";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const provided =
    req.headers.get("x-cron-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return provided === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handle();
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handle();
}

async function handle() {
  const now = new Date();
  const due = await prisma.scheduledNotification.findMany({
    where: { status: "pending", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: 200,
  });

  let delivered = 0;
  let failed = 0;
  for (const item of due) {
    const claim = await prisma.scheduledNotification.updateMany({
      where: { id: item.id, status: "pending" },
      data: { status: "in_progress" },
    });
    if (claim.count === 0) continue;
    try {
      const result = await dispatchToUser(item.userId, {
        channel: item.channel as PushChannel,
        title: item.title,
        body: item.body,
        data: item.payload ? safeParse(item.payload) : undefined,
      });
      await prisma.scheduledNotification.update({
        where: { id: item.id },
        data: {
          status: result.delivered > 0 ? "sent" : result.skipped ? "skipped" : "failed",
          sentAt: new Date(),
        },
      });
      if (result.delivered > 0) delivered++;
      else failed++;
    } catch (e) {
      console.error("[cron/dispatch-reminders] error", e);
      await prisma.scheduledNotification.update({
        where: { id: item.id },
        data: { status: "failed", sentAt: new Date() },
      });
      failed++;
    }
  }
  return NextResponse.json({ processed: due.length, delivered, failed });
}

function safeParse(s: string): Record<string, string> | undefined {
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return undefined;
}
