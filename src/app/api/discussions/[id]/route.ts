import { NextResponse } from "next/server";
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
