import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCsv, matchSessionLabel, parseFormTimestamp } from "@/lib/feedback";

// Import a feedback spreadsheet.
//
// Three shapes, chosen by the mapping the admin built on the page:
//   presenterId set          -> the whole form is one session's own form, the
//                               way most of ours are; every row is about that
//                               presenter.
//   sessionColumn set        -> each row rates the one session that column
//                               names; ratingColumns/commentColumns apply to
//                               the whole row.
//   perPresenterColumns set  -> one row rated several sessions; each entry
//                               assigns specific columns to one presenter, and
//                               the row is split into one response per entry.
//
// Either way, storage is one response per (row x session).
//
// Several forms live side by side. Each response remembers the form it came
// from, and an upload replaces only rows carrying the same sourceName, so a
// second form never wipes the first and re-uploading one form as more
// responses arrive updates just that form.
//
// POST {
//   csv: string,
//   sourceName?: string,
//   mapping: {
//     presenterId?: string,
//     sessionColumn?: string,
//     ratingColumns?: string[],
//     commentColumns?: string[],
//     timestampColumn?: string,
//     segmentColumn?: string,     // in person or virtual, for the comparison
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
    sourceName?: string;
    mapping?: {
      presenterId?: string;
      sessionColumn?: string;
      ratingColumns?: string[];
      commentColumns?: string[];
      timestampColumn?: string;
      segmentColumn?: string;
      perPresenterColumns?: { presenterId: string; label: string; ratingColumns: string[]; commentColumns: string[] }[];
    };
  } | null;
  if (!body?.csv || !body.mapping) {
    return NextResponse.json({ error: "Send csv and mapping." }, { status: 400 });
  }

  const sourceName = (body.sourceName || "").trim().slice(0, 200) || "Feedback form";
  const rows = parseCsv(body.csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "That file has a header but no responses." }, { status: 400 });
  }
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const m = body.mapping;
  const perPresenter = Array.isArray(m.perPresenterColumns) && m.perPresenterColumns.length ? m.perPresenterColumns : null;
  if (!perPresenter && !m.sessionColumn && !m.presenterId) {
    return NextResponse.json({ error: "Choose whose session this form is for." }, { status: 400 });
  }

  // Everything confirmed is a match target; the form will not be rating
  // sessions by people who never presented.
  const targets = (await prisma.presenter.findMany({
    where: { status: "confirmed" },
    select: { id: true, name: true, talkTitle: true },
  })).map((p) => ({ presenterId: p.id, name: p.name, talkTitle: p.talkTitle }));

  const wholeForm = !perPresenter && m.presenterId
    ? targets.find((t) => t.presenterId === m.presenterId) || null
    : null;
  if (!perPresenter && m.presenterId && !wholeForm) {
    return NextResponse.json({ error: "That presenter is not on the confirmed list." }, { status: 400 });
  }

  const importId = randomUUID();
  const toCreate: {
    importId: string; sourceName: string; sessionLabel: string; presenterId: string | null;
    ratings: Record<string, number>; comments: Record<string, string>;
    data: Record<string, string>; submittedAt: Date | null; questionOrder: string[];
    segment: string | null;
  }[] = [];

  // The order questions appear on the form. Postgres stores ratings and
  // comments as JSONB, which reorders keys by length, so without this the
  // presenter page would show "What could be improved?" above "What did you
  // like most?" whenever the second was shorter.
  const inFormOrder = (cols: string[] | undefined) => {
    const wanted = new Set(cols || []);
    return header.filter((h) => wanted.has(h));
  };

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
    // Google Forms writes Chicago wall time with no zone; read as UTC it
    // lands five hours early.
    const stamp = tsIdx >= 0 && row[tsIdx] ? parseFormTimestamp(row[tsIdx]) : null;
    const segment = (m.segmentColumn ? raw[m.segmentColumn] : "")?.slice(0, 120) || null;

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
          importId, sourceName, sessionLabel: entry.label, presenterId: entry.presenterId,
          ratings, comments, data: raw, submittedAt: stamp, segment,
          questionOrder: inFormOrder([...entry.ratingColumns, ...entry.commentColumns]),
        });
      }
    } else if (wholeForm) {
      const ratings = collect(m.ratingColumns, true) as Record<string, number>;
      const comments = collect(m.commentColumns, false) as Record<string, string>;
      if (!Object.keys(ratings).length && !Object.keys(comments).length) continue;
      toCreate.push({
        importId, sourceName, sessionLabel: wholeForm.talkTitle || wholeForm.name,
        presenterId: wholeForm.presenterId,
        ratings, comments, data: raw, submittedAt: stamp, segment,
        questionOrder: inFormOrder([...(m.ratingColumns || []), ...(m.commentColumns || [])]),
      });
    } else {
      const label = raw[m.sessionColumn as string] || "";
      if (!label) continue;
      const ratings = collect(m.ratingColumns, true) as Record<string, number>;
      const comments = collect(m.commentColumns, false) as Record<string, string>;
      if (!Object.keys(ratings).length && !Object.keys(comments).length) continue;
      toCreate.push({
        importId, sourceName, sessionLabel: label, presenterId: matchLabel(label),
        ratings, comments, data: raw, submittedAt: stamp, segment,
        questionOrder: inFormOrder([...(m.ratingColumns || []), ...(m.commentColumns || [])]),
      });
    }
  }

  if (!toCreate.length) {
    return NextResponse.json({ error: "No usable responses found with that mapping." }, { status: 400 });
  }

  // Replace this form's own rows only, in one transaction, so an upload can
  // never leave a form half old and half new and can never touch another form.
  await prisma.$transaction([
    prisma.feedbackResponse.deleteMany({ where: { sourceName } }),
    prisma.feedbackResponse.createMany({ data: toCreate }),
  ]);

  const matched = toCreate.filter((x) => x.presenterId).length;
  return NextResponse.json({
    ok: true,
    importId,
    sourceName,
    imported: toCreate.length,
    matched,
    unmatched: toCreate.length - matched,
  });
}
