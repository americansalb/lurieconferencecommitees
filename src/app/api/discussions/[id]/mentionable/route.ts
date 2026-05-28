import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Returns the set of users who can be @-mentioned in this discussion.
// Mirrors the candidate logic in POST /api/discussions/[id]/posts:
//   committee discussion -> the committee's members
//   global discussion    -> all users
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
    select: { committeeId: true },
  });
  if (!discussion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const users = discussion.committeeId
    ? await prisma.committeeMember
        .findMany({
          where: { committeeId: discussion.committeeId },
          select: { user: { select: { id: true, name: true, email: true } } },
        })
        .then((rows) => rows.map((r) => r.user))
    : await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });

  return NextResponse.json({ users });
}
