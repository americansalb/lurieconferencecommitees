import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// The ambassador list with each code's live redemption count, so the page can
// show who is actually driving registrations.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ambassadors = await prisma.ambassador.findMany({ orderBy: { createdAt: "asc" } });
  const codes = ambassadors.map((a) => a.code);
  const codeRows = codes.length
    ? await prisma.discountCode.findMany({
        where: { code: { in: codes } },
        select: { code: true, redeemedCount: true, active: true, expiresAt: true },
      })
    : [];
  const byCode = new Map(codeRows.map((c) => [c.code, c]));

  return NextResponse.json({
    ambassadors: ambassadors.map((a) => ({
      ...a,
      redemptions: byCode.get(a.code)?.redeemedCount ?? 0,
      codeLive: byCode.has(a.code),
    })),
  });
}
