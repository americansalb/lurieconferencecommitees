import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Team members who can host meetings, with whether they've set any
// availability — used by the invite composer to pick calendars to pool.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      _count: { select: { availability: true } },
    },
  });
  const members = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    timezone: u.timezone,
    hasAvailability: u._count.availability > 0,
  }));
  return NextResponse.json({ members });
}
