import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAdmin(role: string) {
  return role === "admin" || role === "developer";
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

  const { userId, committeeId, committeeRole } = await req.json();

  if (!userId || !committeeId || !committeeRole) {
    return NextResponse.json({ error: "userId, committeeId, and committeeRole are required" }, { status: 400 });
  }

  if (!["member", "chair"].includes(committeeRole)) {
    return NextResponse.json({ error: "committeeRole must be 'member' or 'chair'" }, { status: 400 });
  }

  const membership = await prisma.committeeMember.findUnique({
    where: { userId_committeeId: { userId, committeeId } },
  });

  if (!membership) {
    return NextResponse.json({ error: "User is not a member of this committee" }, { status: 404 });
  }

  const updated = await prisma.committeeMember.update({
    where: { userId_committeeId: { userId, committeeId } },
    data: { role: committeeRole },
    include: {
      user: { select: { id: true, name: true, email: true } },
      committee: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(updated);
}
