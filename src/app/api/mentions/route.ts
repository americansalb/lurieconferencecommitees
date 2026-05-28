import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const unreadOnly = new URL(req.url).searchParams.get("unread") === "1";

  const mentions = await prisma.mention.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      post: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
          discussion: {
            select: {
              id: true,
              title: true,
              committee: { select: { id: true, name: true, slug: true, color: true } },
            },
          },
        },
      },
    },
  });

  const unreadCount = await prisma.mention.count({
    where: { userId, readAt: null },
  });

  return NextResponse.json({ mentions, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { ids, all } = await req.json().catch(() => ({}));

  const now = new Date();
  if (all) {
    await prisma.mention.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
  } else if (Array.isArray(ids) && ids.length) {
    await prisma.mention.updateMany({
      where: { userId, id: { in: ids } },
      data: { readAt: now },
    });
  } else {
    return NextResponse.json({ error: "Pass { ids } or { all: true }" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
