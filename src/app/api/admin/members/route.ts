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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      timezone: true,
      createdAt: true,
      committees: {
        include: { committee: { select: { id: true, name: true, slug: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
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

  const { userId, role, committeeIds } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Update role if provided
  if (role) {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  // Update committee memberships if provided
  if (committeeIds !== undefined) {
    // Remove all existing memberships
    await prisma.committeeMember.deleteMany({ where: { userId } });
    // Add new memberships
    if (committeeIds.length > 0) {
      await prisma.committeeMember.createMany({
        data: committeeIds.map((cid: string) => ({ userId, committeeId: cid })),
      });
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      timezone: true,
      createdAt: true,
      committees: {
        include: { committee: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  return NextResponse.json(updated);
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

  const { userId } = await req.json();
  const currentUserId = (session.user as { id: string }).id;

  if (userId === currentUserId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
