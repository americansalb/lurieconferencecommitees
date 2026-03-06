import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function canModifyPost(userRole: string, userId: string, postAuthorId: string) {
  if (userRole === "developer" || userRole === "admin") return true;
  return userId === postAuthorId;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
  });

  if (!post || post.discussionId !== params.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!canModifyPost(userRole, userId, post.authorId)) {
    return NextResponse.json({ error: "Not authorized to edit this post" }, { status: 403 });
  }

  const { body } = await req.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Post body is required" }, { status: 400 });
  }

  const updated = await prisma.post.update({
    where: { id: params.postId },
    data: { body: body.trim() },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
  });

  if (!post || post.discussionId !== params.id) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!canModifyPost(userRole, userId, post.authorId)) {
    return NextResponse.json({ error: "Not authorized to delete this post" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: params.postId } });

  return NextResponse.json({ success: true });
}
