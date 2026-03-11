import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const discussions = await prisma.discussion.findMany({
    include: {
      author: { select: { id: true, name: true } },
      committee: { select: { id: true, name: true, slug: true, color: true } },
      _count: { select: { posts: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(discussions);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { discussionId, title, isPinned } = await req.json();

  if (!discussionId) {
    return NextResponse.json({ error: "discussionId is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (isPinned !== undefined) data.isPinned = isPinned;

  const discussion = await prisma.discussion.update({
    where: { id: discussionId },
    data,
    include: {
      author: { select: { id: true, name: true } },
      committee: { select: { id: true, name: true, slug: true, color: true } },
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json(discussion);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { discussionId } = await req.json();

  if (!discussionId) {
    return NextResponse.json({ error: "discussionId is required" }, { status: 400 });
  }

  await prisma.discussion.delete({ where: { id: discussionId } });
  return NextResponse.json({ success: true });
}
