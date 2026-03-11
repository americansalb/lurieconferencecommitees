import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true } },
      committee: { select: { id: true, name: true, slug: true, color: true } },
      posts: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  return NextResponse.json(discussion);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string }).role;
    const canModerate = userRole === "admin" || userRole === "developer";

    const discussion = await prisma.discussion.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    // Only the author or a moderator can delete
    if (discussion.authorId !== userId && !canModerate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.discussion.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete discussion" }, { status: 500 });
  }
}
