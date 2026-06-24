import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPortalLinkTo } from "@/lib/attendee-mail";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await sendPortalLinkTo([params.id]);
  return NextResponse.json({ ok: result.sent > 0, ...result });
}
