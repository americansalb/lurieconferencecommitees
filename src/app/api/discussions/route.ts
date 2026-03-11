import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const committeeId = searchParams.get("committeeId");

  // When filtering by committee, also include global discussions
  const where = committeeId
    ? { OR: [{ committeeId }, { isGlobal: true }] }
    : {};

  const discussions = await prisma.discussion.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      committee: { select: { id: true, name: true, slug: true, color: true } },
      _count: { select: { posts: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(discussions);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, committeeId } = await req.json();

    if (!title || !committeeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string }).role;

    // "all" creates ONE global discussion visible in every committee
    if (committeeId === "all") {
      if (userRole !== "admin" && userRole !== "developer") {
        return NextResponse.json({ error: "Only admins can broadcast to all committees" }, { status: 403 });
      }
      const discussion = await prisma.discussion.create({
        data: { title, committeeId: null, authorId: userId, isGlobal: true },
        include: { author: { select: { id: true, name: true } } },
      });
      return NextResponse.json(discussion, { status: 201 });
    }

    const membership = await prisma.committeeMember.findUnique({
      where: { userId_committeeId: { userId, committeeId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Must be a committee member to create discussions" }, { status: 403 });
    }

    const discussion = await prisma.discussion.create({
      data: { title, committeeId, authorId: userId },
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json(discussion, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 });
  }
}
