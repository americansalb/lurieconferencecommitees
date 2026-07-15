import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildAttendeeInvite } from "@/lib/attendees";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Renders an invite template with the chosen options so admins can see exactly
// what will go out before sending. Does not touch the database.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const template = ["standard", "alumni", "student", "former-student"].includes(b?.template) ? String(b.template) : "standard";
  const pct = Math.max(0, Math.min(100, Number.isFinite(b?.discountPercent) ? Number(b.discountPercent) : 25));
  const firstName = (b?.firstName ? String(b.firstName) : "").trim() || "Alex";
  const { subject, html } = buildAttendeeInvite({
    firstName, inviteToken: "PREVIEW", discountPercent: pct,
    inviteMessage: b?.inviteMessage ? String(b.inviteMessage) : null, template,
    // Demo 2024 facts so the reunion template previews fully personalized.
    returning: { status: "paid", mode: "in-person", languages: "Spanish, English" },
  });
  return NextResponse.json({ subject, html, template });
}
