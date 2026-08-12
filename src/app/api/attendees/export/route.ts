import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  EXPORT_COLUMNS, exportRowPages, csvLine, tokenIsValid,
  type ExportMode, type ExportScope,
} from "@/lib/attendee-export";

// The attendee list as CSV, for a download or for a Google Sheet to pull with
// IMPORTDATA.
//
// Streamed, a page of rows at a time. The obvious version built the whole file
// in memory first and took the instance down with it: the attendee table holds
// every imported training student and every registry ever loaded, so "everyone"
// is tens of thousands of rows, and between the database objects, the mapped
// arrays and the joined string there were several copies of the lot in 512MB.
// Streaming keeps one page alive at a time and hands bytes to the client as
// they are ready, which also means the download starts immediately instead of
// after a long silence.
//
// Google fetches this from its own servers with no cookies, so a signed-in
// session is not available and the request carries a token instead. An admin
// session also works, which is what makes the link testable from a browser.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(csvLine([...EXPORT_COLUMNS])));
        for await (const page of exportRowPages(mode, scope)) {
          // One string per page, not per file: still bounded, without a write
          // syscall for every single row.
          controller.enqueue(encoder.encode("\r\n" + page.map(csvLine).join("\r\n")));
        }
        controller.close();
      } catch (e) {
        // The header is already out by this point, so the file cannot be
        // withdrawn. Say so inside it rather than truncating silently and
        // leaving somebody to work from a list that quietly stops early.
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`\r\n"EXPORT FAILED PART WAY THROUGH","${msg.replace(/"/g, '""')}"`));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
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
