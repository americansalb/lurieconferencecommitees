import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EXPORT_COLUMNS, exportRows, toCsv, tokenIsValid, type ExportMode, type ExportScope } from "@/lib/attendee-export";

// The attendee list as CSV, for a Google Sheet to pull with IMPORTDATA.
//
// Google fetches this from its own servers with no cookies, so a signed-in
// session is not available and the request carries a token instead. An admin
// session also works, which is what makes the link testable from a browser.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawMode = url.searchParams.get("mode");
  const mode: ExportMode = rawMode === "virtual" ? "virtual" : rawMode === "all" ? "all" : "in-person";
  // Default stays "paid", so the Google Sheet tabs keep showing the room rather
  // than the pipeline. A download can ask for everyone.
  const scope: ExportScope = url.searchParams.get("scope") === "all" ? "all" : "paid";
  // Google needs this inline; a browser download needs it as an attachment.
  const download = url.searchParams.get("download") === "1";

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

  const rows = await exportRows(mode, scope);
  const csv = toCsv([[...EXPORT_COLUMNS], ...rows]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // Google caches IMPORTDATA for about an hour on its own; asking for no
      // caching at least means a manual refresh gets the current list.
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="attendees-${scope === "all" ? "everyone" : mode}.csv"`,
    },
  });
}
