import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  const user = await requireMobileUser(req);
  if (user instanceof Response) return user;
  await prisma.mobileSession.delete({ where: { id: user.sessionId } }).catch(() => {});
  return NextResponse.json({ success: true });
}
