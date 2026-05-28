import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function newToken() {
  return randomBytes(24).toString("base64url");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { icalToken: true },
  });
  if (!user?.icalToken) {
    user = await prisma.user.update({
      where: { id: userId },
      data: { icalToken: newToken() },
      select: { icalToken: true },
    });
  }
  return NextResponse.json({ token: user.icalToken });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { icalToken: newToken() },
    select: { icalToken: true },
  });
  return NextResponse.json({ token: updated.icalToken });
}
