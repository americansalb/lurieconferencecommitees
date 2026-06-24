import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPortalLinkTo } from "@/lib/attendee-mail";

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
  if (!ids.length) return NextResponse.json({ error: "No recipients selected." }, { status: 400 });
  const result = await sendPortalLinkTo(ids);
  return NextResponse.json({ ok: true, ...result });
}
