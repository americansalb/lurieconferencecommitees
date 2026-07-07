import { NextResponse } from "next/server";
import { dispatchDueReminders } from "@/lib/reminders";
import { runEmailQueue } from "@/lib/email-queue";

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

// The in-app scheduler (src/lib/scheduler.ts) now ticks these same jobs every
// minute from inside the web service, so this endpoint is redundancy for an
// external cron rather than the only thing keeping mail moving. Both jobs
// claim work atomically, so overlap is harmless.
async function handle() {
  const reminders = await dispatchDueReminders();
  const emails = await runEmailQueue();
  return NextResponse.json({ ...reminders, emails });
}
