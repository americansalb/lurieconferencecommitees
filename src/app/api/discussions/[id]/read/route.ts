import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  const now = new Date();
  await prisma.discussionRead.upsert({
    where: { userId_discussionId: { userId, discussionId: params.id } },
    create: { userId, discussionId: params.id, lastReadAt: now },
    update: { lastReadAt: now },
  });

  return NextResponse.json({ ok: true, lastReadAt: now.toISOString() });
}
