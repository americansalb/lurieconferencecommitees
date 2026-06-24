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

  const result = await sendBroadcastTo(ids, subject, text, ctaUrl ? { url: ctaUrl, label: ctaLabel || "Open" } : null);
  return NextResponse.json({ ok: true, ...result });
}
