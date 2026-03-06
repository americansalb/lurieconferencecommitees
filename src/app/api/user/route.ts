import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, timezone: true },
  });

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { timezone } = await req.json();

  if (!timezone) {
    return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { timezone },
    select: { id: true, name: true, email: true, role: true, timezone: true },
  });

  return NextResponse.json(user);
}
