import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { questionOrderOf } from "@/lib/feedback";

// A presenter's own raw feedback as CSV, behind their share token.
//
// Deliberately built from the mapped answers rather than the imported rows:
// the untouched spreadsheet row can carry a respondent's name or another
// session's columns, and neither belongs in a file we hand a presenter.
// Hidden comments stay hidden here too, or the hide switch would be
// decorative.

export const dynamic = "force-dynamic";

function esc(v: string): string {
  return `"${(v || "").replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const presenter = await prisma.presenter.findUnique({
    where: { feedbackToken: params.token },
    select: { id: true, name: true },
  });
  if (!presenter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.feedbackResponse.findMany({
    where: { presenterId: presenter.id },
    orderBy: [{ submittedAt: "asc" }, { importedAt: "asc" }],
    select: { ratings: true, comments: true, hiddenKeys: true, submittedAt: true, questionOrder: true },
  });

  // Columns are every question that appears, ratings first, each group in the
  // order the form asked them so the file reads like the form did.
  const order = questionOrderOf(rows);
  const asked = (key: "ratings" | "comments") =>
    order.filter((q) => rows.some((r) => q in ((r[key] || {}) as object)));
  const ratingCols = asked("ratings");
  const commentCols = asked("comments");

  // Numbered to match the cards on their page. No submission time, same as
  // the page: it can point to who wrote a comment.
  const header = ["Response", ...ratingCols, ...commentCols];
  const lines = [header.map(esc).join(",")];
  rows.forEach((r, i) => {
    const ratings = (r.ratings || {}) as Record<string, number>;
    const comments = (r.comments || {}) as Record<string, string>;
    const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
    lines.push([
      String(i + 1),
      ...ratingCols.map((q) => (ratings[q] != null ? String(ratings[q]) : "")),
      ...commentCols.map((q) => (hidden[q] ? "" : comments[q] || "")),
    ].map(esc).join(","));
  });

  const safeName = presenter.name.replace(/[^\w]+/g, "-").toLowerCase();
  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="feedback-${safeName}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
