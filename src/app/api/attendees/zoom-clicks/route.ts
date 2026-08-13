import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// The Zoom click log for /zoom-log: every recorded hit on the personal
// /z/<token>/<day> links, newest first, with the attendee it belongs to.
// Admin-only, since rows carry IP addresses.

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const clicks = await prisma.attendeeEvent.findMany({
    where: { type: "zoom_click" },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      attendee: { select: { id: true, firstName: true, lastName: true, email: true, attendDay: true } },
    },
  });

  return NextResponse.json({ clicks });
}
