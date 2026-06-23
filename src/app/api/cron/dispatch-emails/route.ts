import { NextResponse } from "next/server";
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
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await runEmailQueue());
}
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await runEmailQueue());
}
