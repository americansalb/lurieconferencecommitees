import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// A team member's own availability: recurring weekly rules + one-off
// exceptions. GET returns the current user's; POST replaces the weekly rules.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rules, exceptions, me] = await Promise.all([
    prisma.memberAvailability.findMany({ where: { userId }, orderBy: [{ weekday: "asc" }, { startMin: "asc" }] }),
    prisma.availabilityException.findMany({ where: { userId }, orderBy: { startAt: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);
  return NextResponse.json({ rules, exceptions, timezone: me?.timezone || "America/Chicago" });
}

// Replace the full set of weekly rules for the current user. Body:
// { rules: [{ weekday, startMin, endMin }] }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawRules = Array.isArray(body.rules) ? body.rules : [];

  const rules: { weekday: number; startMin: number; endMin: number }[] = [];
  for (const r of rawRules) {
    const weekday = Math.round(Number(r.weekday));
    const startMin = Math.round(Number(r.startMin));
    const endMin = Math.round(Number(r.endMin));
    if (weekday < 0 || weekday > 6) continue;
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) continue;
    if (startMin < 0 || endMin > 1440 || endMin <= startMin) continue;
    rules.push({ weekday, startMin, endMin });
  }

  await prisma.$transaction([
    prisma.memberAvailability.deleteMany({ where: { userId } }),
    ...(rules.length
      ? [prisma.memberAvailability.createMany({ data: rules.map((r) => ({ ...r, userId })) })]
      : []),
  ]);

  const saved = await prisma.memberAvailability.findMany({
    where: { userId },
    orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
  });
  return NextResponse.json({ ok: true, rules: saved });
}
