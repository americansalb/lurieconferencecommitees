import { runEmailQueue } from "./email-queue";
import { dispatchDueReminders } from "./reminders";

// The in-app scheduler: the web service ticks its own queues instead of
// depending on an external cron reaching an HTTP endpoint. Discovered the
// hard way: the Render cron defined in render.yaml was never actually
// running, so queued invites sat "pending" until someone clicked "send this
// one" by hand. runEmailQueue keeps its own pacing governor (one message per
// tick, hourly/daily caps, business-hours schedule), so a 60-second tick can
// never blast the queue — and both jobs claim rows atomically, so the cron
// endpoints staying alive alongside this (or a second app instance) is safe.
const TICK_MS = 60_000;

declare global {
  // Survives Next.js module re-evaluation so only one ticker ever runs
  // per process.
  var __lccSchedulerStarted: boolean | undefined;
}

export function startScheduler() {
  if (globalThis.__lccSchedulerStarted) return;
  globalThis.__lccSchedulerStarted = true;

  const tick = async () => {
    try {
      const emails = await runEmailQueue();
      if (emails.sent || emails.failed) {
        console.log(`[scheduler] email tick: sent=${emails.sent} failed=${emails.failed}`);
      }
    } catch (e) {
      console.error("[scheduler] email queue tick failed", e);
    }
    try {
      const reminders = await dispatchDueReminders();
      if (reminders.delivered || reminders.failed) {
        console.log(`[scheduler] reminders tick: delivered=${reminders.delivered} failed=${reminders.failed}`);
      }
    } catch (e) {
      console.error("[scheduler] reminders tick failed", e);
    }
  };

  const interval = setInterval(() => void tick(), TICK_MS);
  // Never keep the process alive just for the ticker.
  interval.unref?.();
  // First tick shortly after boot, so a deploy/restart doesn't add a full
  // minute of latency to an already-due queue.
  setTimeout(() => void tick(), 10_000).unref?.();

  console.log("[scheduler] in-app scheduler started (email queue + reminders, every 60s)");
}
