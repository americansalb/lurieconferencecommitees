import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  const user = await requireMobileUser(req);
  if (user instanceof Response) return user;
  const memberships = await prisma.committeeMember.findMany({
    where: { userId: user.id },
    include: {
      committee: {
        select: { id: true, name: true, slug: true, color: true, description: true },
      },
    },
  });
  return NextResponse.json(
    memberships.map((m) => ({ role: m.role, committee: m.committee }))
  );
}
