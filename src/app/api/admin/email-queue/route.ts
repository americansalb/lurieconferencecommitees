import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPaused, setPaused, getPolicy } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [counts, nextDue, policy, paused] = await Promise.all([
    prisma.emailQueue.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.emailQueue.findFirst({
      where: { status: "pending" },
      orderBy: { scheduledFor: "asc" },
      select: { scheduledFor: true },
    }),
    getPolicy(),
    isPaused(),
  ]);

  const last24h = await prisma.emailQueue.count({
    where: { status: "sent", sentAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
  });

  return NextResponse.json({
    counts: counts.reduce<Record<string, number>>((acc, c) => ((acc[c.status] = c._count._all), acc), {}),
    nextScheduledFor: nextDue?.scheduledFor || null,
    sentLast24h: last24h,
    policy,
    paused,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { paused } = await req.json();
  if (typeof paused === "boolean") {
    await setPaused(paused);
  }
  return NextResponse.json({ ok: true });
}
