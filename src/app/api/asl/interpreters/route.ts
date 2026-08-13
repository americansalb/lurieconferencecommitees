import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Interpreter submissions for the /asl-team page. Any logged-in member can
// look; accepting happens through the per-interpreter accept route and is
// admin-only.

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const interpreters = await prisma.aslInterpreter.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ interpreters });
}
