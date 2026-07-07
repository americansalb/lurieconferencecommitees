import { prisma } from "./db";
import { dispatchToUser, PushChannel } from "./push";

// Deliver due scheduled notifications (meeting reminders etc.). Extracted from
// the cron route so the in-app scheduler and the HTTP endpoint share one
// implementation. Claims each row atomically, so overlapping invocations are
// safe.
export async function dispatchDueReminders(): Promise<{ processed: number; delivered: number; failed: number }> {
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
      console.error("[reminders] dispatch error", e);
      await prisma.scheduledNotification.update({
        where: { id: item.id },
        data: { status: "failed", sentAt: new Date() },
      });
      failed++;
    }
  }
  return { processed: due.length, delivered, failed };
}

function safeParse(s: string): Record<string, string> | undefined {
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return undefined;
}
