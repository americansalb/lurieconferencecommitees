import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { vancroPackage } from "@/lib/vancro-package";
import { zipStream } from "@/lib/zip-stream";

// Everything Vancro asked for, as one zip: the overview, their RID CEU Upload
// Form filled in, every session's evaluations, and the slides that may be
// shared. Streamed, so slide decks pass through without being held in memory.
// Admins only: it carries respondents' names and RID numbers.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const entries = await vancroPackage();
  return new NextResponse(zipStream(entries), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Vancro RID CEU Documentation - Lurie AALB 2026.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
