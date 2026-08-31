import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCsv, matchSessionLabel } from "@/lib/feedback";

// Import a feedback spreadsheet.
//
// Two shapes, chosen by the mapping the admin built on the page:
//   sessionColumn set        -> each row rates the one session that column
//                               names; ratingColumns/commentColumns apply to
//                               the whole row.
//   perPresenterColumns set  -> one row rated several sessions; each entry
//                               assigns specific columns to one presenter, and
//                               the row is split into one response per entry.
//
// Either way, storage is one response per (row x session). importId groups the
// batch so `replace: true` swaps an earlier upload atomically rather than
// stacking duplicates.
//
// POST {
//   csv: string,
//   replace?: boolean,
//   mapping: {
//     sessionColumn?: string,
//     ratingColumns?: string[],
//     commentColumns?: string[],
//     timestampColumn?: string,
//     perPresenterColumns?: { presenterId: string, label: string,
//                             ratingColumns: string[], commentColumns: string[] }[],
//   },
// }

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    csv?: string;
    replace?: boolean;
    mapping?: {
      sessionColumn?: string;
      ratingColumns?: string[];
      commentColumns?: string[];
      timestampColumn?: string;
      perPresenterColumns?: { presenterId: string; label: string; ratingColumns: string[]; commentColumns: string[] }[];
    };
  } | null;
  if (!body?.csv || !body.mapping) {
    return NextResponse.json({ error: "Send csv and mapping." }, { status: 400 });
  }

  const rows = parseCsv(body.csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "That file has a header but no responses." }, { status: 400 });
  }
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const m = body.mapping;
  const perPresenter = Array.isArray(m.perPresenterColumns) && m.perPresenterColumns.length ? m.perPresenterColumns : null;
  if (!perPresenter && !m.sessionColumn) {
    return NextResponse.json({ error: "The mapping needs a session column, or per-presenter columns." }, { status: 400 });
  }

  // Everything confirmed is a match target; the form will not be rating
  // sessions by people who never presented.
  const targets = (await prisma.presenter.findMany({
    where: { status: "confirmed" },
    select: { id: true, name: true, talkTitle: true },
  })).map((p) => ({ presenterId: p.id, name: p.name, talkTitle: p.talkTitle }));

  const importId = randomUUID();
  const toCreate: {
    importId: string; sessionLabel: string; presenterId: string | null;
    ratings: Record<string, number>; comments: Record<string, string>;
    data: Record<string, string>; submittedAt: Date | null;
  }[] = [];

  const tsIdx = m.timestampColumn ? idx(m.timestampColumn) : -1;
  // Session labels repeat constantly, so match each distinct one once.
  const labelCache = new Map<string, string | null>();
  const matchLabel = (label: string) => {
    if (!labelCache.has(label)) labelCache.set(label, matchSessionLabel(label, targets));
    return labelCache.get(label) ?? null;
  };

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    const raw: Record<string, string> = {};
    header.forEach((h, i) => { if (h) raw[h] = (row[i] ?? "").trim(); });
    const submittedAt = tsIdx >= 0 && row[tsIdx] ? new Date(row[tsIdx]) : null;
    const stamp = submittedAt && !isNaN(submittedAt.getTime()) ? submittedAt : null;

    const collect = (cols: string[] | undefined, numeric: boolean) => {
      const out: Record<string, number | string> = {};
      for (const c of cols || []) {
        const i = idx(c);
        if (i < 0) continue;
        const v = (row[i] ?? "").trim();
        if (!v) continue;
        if (numeric) {
          // "5", "5 - Excellent", "Excellent (5)" all mean 5.
          const num = Number((v.match(/-?\d+(\.\d+)?/) || [])[0]);
          if (Number.isFinite(num)) out[c] = num;
        } else out[c] = v;
      }
      return out;
    };

    if (perPresenter) {
      for (const entry of perPresenter) {
        const ratings = collect(entry.ratingColumns, true) as Record<string, number>;
        const comments = collect(entry.commentColumns, false) as Record<string, string>;
        // A respondent who skipped this session entirely leaves no response.
        if (!Object.keys(ratings).length && !Object.keys(comments).length) continue;
        toCreate.push({
          importId, sessionLabel: entry.label, presenterId: entry.presenterId,
          ratings, comments, data: raw, submittedAt: stamp,
        });
      }
    } else {
      const label = raw[m.sessionColumn as string] || "";
      if (!label) continue;
      const ratings = collect(m.ratingColumns, true) as Record<string, number>;
      const comments = collect(m.commentColumns, false) as Record<string, string>;
      if (!Object.keys(ratings).length && !Object.keys(comments).length) continue;
      toCreate.push({
        importId, sessionLabel: label, presenterId: matchLabel(label),
        ratings, comments, data: raw, submittedAt: stamp,
      });
    }
  }

  if (!toCreate.length) {
    return NextResponse.json({ error: "No usable responses found with that mapping." }, { status: 400 });
  }

  // Replace-in-one-transaction, so a re-import can never leave the table half
  // old and half new.
  await prisma.$transaction([
    ...(body.replace ? [prisma.feedbackResponse.deleteMany({})] : []),
    prisma.feedbackResponse.createMany({ data: toCreate }),
  ]);

  const matched = toCreate.filter((x) => x.presenterId).length;
  return NextResponse.json({
    ok: true,
    importId,
    imported: toCreate.length,
    matched,
    unmatched: toCreate.length - matched,
  });
}
