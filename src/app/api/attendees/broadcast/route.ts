import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendBroadcastTo } from "@/lib/attendee-mail";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const ctaUrl = typeof body?.ctaUrl === "string" && body.ctaUrl.trim() ? body.ctaUrl.trim() : null;
  const ctaLabel = typeof body?.ctaLabel === "string" && body.ctaLabel.trim() ? body.ctaLabel.trim() : null;
  if (!ids.length) return NextResponse.json({ error: "No recipients selected." }, { status: 400 });
  if (!subject || !text) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });

  // Hard guardrail: a broadcast sends immediately, with no pacing. Refuse to
  // fire at a whole roster at once — that's how you torch your sender
  // reputation. Above the cap, narrow the selection or use paced invites.
  const IMMEDIATE_BROADCAST_CAP = 100;
  if (ids.length > IMMEDIATE_BROADCAST_CAP) {
    return NextResponse.json(
      { error: `You selected ${ids.length} people. An immediate broadcast is capped at ${IMMEDIATE_BROADCAST_CAP} to protect deliverability. Narrow the selection, or use "Queue invites" to send them paced through the queue.` },
      { status: 400 },
    );
  }

  const result = await sendBroadcastTo(ids, subject, text, ctaUrl ? { url: ctaUrl, label: ctaLabel || "Open" } : null);
  return NextResponse.json({ ok: true, ...result });
}
