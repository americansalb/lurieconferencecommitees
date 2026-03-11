import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { committeeId } = await req.json();
    if (!committeeId) {
      return NextResponse.json({ error: "Missing committeeId" }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;

    const existing = await prisma.committeeMember.findUnique({
      where: { userId_committeeId: { userId, committeeId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    const membership = await prisma.committeeMember.create({
      data: { userId, committeeId },
      include: { committee: { select: { name: true, slug: true } } },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to join committee" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { committeeId } = await req.json();
    if (!committeeId) {
      return NextResponse.json({ error: "Missing committeeId" }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;

    const existing = await prisma.committeeMember.findUnique({
      where: { userId_committeeId: { userId, committeeId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not a member" }, { status: 404 });
    }

    await prisma.committeeMember.delete({
      where: { userId_committeeId: { userId, committeeId } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to leave committee" }, { status: 500 });
  }
}
