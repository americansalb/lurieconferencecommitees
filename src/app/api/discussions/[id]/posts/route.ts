import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { body } = await req.json();

    if (!body) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: params.id },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    const userId = (session.user as { id: string }).id;

    const membership = await prisma.committeeMember.findUnique({
      where: { userId_committeeId: { userId, committeeId: discussion.committeeId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Must be a committee member to reply" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: { discussionId: params.id, authorId: userId, body },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
