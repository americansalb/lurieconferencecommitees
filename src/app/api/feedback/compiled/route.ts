import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compileFeedback, compiledCsv } from "@/lib/feedback-compiled";

// All feedback from every imported form, for the team's compiled view.
// ?format=csv downloads it as one long sheet, a line per answer.

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  if (new URL(req.url).searchParams.get("format") === "csv") {
    return new NextResponse(await compiledCsv(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="all-feedback-2026.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  return NextResponse.json(await compileFeedback());
}
