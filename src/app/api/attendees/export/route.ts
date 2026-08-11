import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EXPORT_COLUMNS, exportRows, toCsv, tokenIsValid, type ExportMode } from "@/lib/attendee-export";

// The attendee list as CSV, for a Google Sheet to pull with IMPORTDATA.
//
// Google fetches this from its own servers with no cookies, so a signed-in
// session is not available and the request carries a token instead. An admin
// session also works, which is what makes the link testable from a browser.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode: ExportMode = url.searchParams.get("mode") === "virtual" ? "virtual" : "in-person";

  const token = url.searchParams.get("token");
  let allowed = await tokenIsValid(token);
  if (!allowed) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    allowed = role === "admin" || role === "developer";
  }
  if (!allowed) {
    return new NextResponse("Not authorized. Check the token on the Attendees page.", { status: 401 });
  }

  const rows = await exportRows(mode);
  const csv = toCsv([[...EXPORT_COLUMNS], ...rows]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // Google caches IMPORTDATA for about an hour on its own; asking for no
      // caching at least means a manual refresh gets the current list.
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `inline; filename="attendees-${mode}.csv"`,
    },
  });
}
