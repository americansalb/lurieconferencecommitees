import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const user = await requireMobileUser(req);
  if (user instanceof Response) return user;

  const memberships = await prisma.committeeMember.findMany({
    where: { userId: user.id },
    select: { committeeId: true },
  });
  const committeeIds = memberships.map((m) => m.committeeId);

  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [events, tasks, recentPosts] = await Promise.all([
    prisma.event.findMany({
      where: {
        committeeId: { in: committeeIds },
        endTime: { gte: now },
        startTime: { lte: horizon },
      },
      include: { committee: { select: { id: true, name: true, slug: true, color: true } } },
      orderBy: { startTime: "asc" },
      take: 50,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: user.id, status: { not: "done" } },
          { committeeId: { in: committeeIds }, status: { not: "done" }, endDate: { gte: now } },
        ],
      },
      include: {
        committee: { select: { id: true, name: true, slug: true, color: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { endDate: "asc" },
      take: 50,
    }),
    prisma.post.findMany({
      where: { discussion: { committeeId: { in: committeeIds } } },
      include: {
        author: { select: { id: true, name: true } },
        discussion: {
          select: {
            id: true,
            title: true,
            committee: { select: { id: true, name: true, slug: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return NextResponse.json({ events, tasks, recentPosts });
}
