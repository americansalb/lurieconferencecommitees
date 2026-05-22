import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

async function getUserId(req: Request): Promise<string | null> {
  const mobile = await getMobileUserFromRequest(req);
  if (mobile) return mobile.id;
  const session = await getServerSession(authOptions);
  if (session?.user) return (session.user as { id: string }).id;
  return null;
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const device = await prisma.device.findUnique({ where: { id: params.id } });
  if (!device || device.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.device.delete({ where: { id: device.id } });
  return NextResponse.json({ success: true });
}
