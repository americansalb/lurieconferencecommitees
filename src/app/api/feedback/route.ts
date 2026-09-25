import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  assemblePresenterFeedback, buildPresenterReport, hiddenFromPresenter, isNonAnswer, offTopicReason,
  questionOrderOf, questionStats, suggestHighlights,
} from "@/lib/feedback";
import { feedbackUrlFor } from "@/lib/feedback-links";

// The admin's view of all feedback, and the two corrections they can make:
// assigning unmatched rows to a presenter, and hiding a comment from a share
// page. Comparisons across presenters live here and only here.

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const rows = await prisma.feedbackResponse.findMany({
    orderBy: { importedAt: "asc" },
    select: {
      id: true, sessionLabel: true, presenterId: true, sourceName: true,
      ratings: true, comments: true, hiddenKeys: true, featuredKeys: true, keptKeys: true, sharedWith: true, submittedAt: true, questionOrder: true,
    },
  });
  const presenters = await prisma.presenter.findMany({
    where: { status: "confirmed" },
    select: { id: true, name: true, talkTitle: true, email: true, feedbackSentAt: true, coPresenters: true },
    orderBy: { name: "asc" },
  });

  // Per presenter: full stats and every comment, hidden ones flagged rather
  // than removed, since the admin needs to see what is hidden to unhide it.
  const byPresenter = presenters.map((p) => {
    // Their own responses and any session they shared (a panel).
    const mine = rows.filter((r) => r.presenterId === p.id || r.sharedWith.includes(p.id));
    const view = assemblePresenterFeedback(mine);
    const report = buildPresenterReport(mine);
    // Suggestions are keyed by response number, which is position in `mine`.
    const suggested = suggestHighlights(report.responses, report.scale);
    const commentRows = mine.flatMap((r, i) => {
      const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
      const picks = (r.featuredKeys || {}) as Record<string, { at?: string } | undefined>;
      const kept = (r.keptKeys || {}) as Record<string, unknown>;
      return Object.entries((r.comments || {}) as Record<string, string>)
        .filter(([, text]) => (text || "").trim() && !isNonAnswer(text))
        .map(([question, text]) => {
          const offTopic = offTopicReason(text);
          return {
            responseId: r.id, question, text,
            // Hidden by hand.
            hidden: !!hidden[question],
            // Why it looks like it is not about the speaker, if it does.
            offTopic,
            // Flagged, and the team chose to show it to the speaker anyway.
            kept: !!kept[question],
            // Flagged and therefore off their page, with no one having said otherwise.
            autoHidden: !!offTopic && !kept[question] && !hidden[question],
            featured: !!picks[question] && !hiddenFromPresenter(r, question, text),
            featuredAt: picks[question]?.at || "",
            suggested: suggested.has(`${i + 1}|${question}`),
          };
        });
    })
      // Picked first, in the order picked; then suggestions; then the rest.
      .sort((a, b) =>
        Number(b.featured) - Number(a.featured)
        || a.featuredAt.localeCompare(b.featuredAt)
        || Number(b.suggested) - Number(a.suggested));
    return {
      presenter: p, responseCount: mine.length, questions: view.questions, commentRows,
      // What their email will quote, so the send panel can show it first.
      emailQuote: report.highlights[0]?.text || null,
    };
  });

  // Every comment flagged as not about the speaker, across all presenters,
  // for the team to check: kept off the speaker's page unless approved here.
  const offTopic = byPresenter.flatMap((b) => b.commentRows
    .filter((c) => c.offTopic && !c.hidden)
    .map((c) => ({
      presenterId: b.presenter.id, presenterName: b.presenter.name,
      responseId: c.responseId, question: c.question, text: c.text,
      reason: c.offTopic as string, kept: c.kept,
    })));

  // What could not be matched, grouped by label so one assignment fixes the
  // whole group.
  const unmatchedRows = rows.filter((r) => !r.presenterId);
  const unmatched = Array.from(
    unmatchedRows.reduce((m, r) => m.set(r.sessionLabel, (m.get(r.sessionLabel) || 0) + 1), new Map<string, number>()),
  ).map(([label, count]) => ({ label, count }));

  // The conference as a whole: every answer to every question, across every
  // session, so the overall picture is not a guess from the per-session means.
  const overallByQuestion = new Map<string, number[]>();
  for (const r of rows) {
    for (const [q, val] of Object.entries((r.ratings || {}) as Record<string, unknown>)) {
      const num = typeof val === "number" ? val : Number(val);
      if (!Number.isFinite(num)) continue;
      if (!overallByQuestion.has(q)) overallByQuestion.set(q, []);
      overallByQuestion.get(q)!.push(num);
    }
  }
  const formOrder = questionOrderOf(rows);
  const rank = (q: string) => { const i = formOrder.indexOf(q); return i < 0 ? formOrder.length : i; };
  const overall = {
    responses: rows.length,
    sessionsRated: new Set(rows.filter((r) => r.presenterId).map((r) => r.presenterId)).size,
    questions: Array.from(overallByQuestion.entries())
      .sort(([a], [b]) => rank(a) - rank(b))
      .map(([q, vals]) => questionStats(q, vals))
      .filter((x): x is NonNullable<typeof x> => !!x),
  };

  // The forms on file, each replaceable and deletable on its own.
  const sources = Array.from(
    rows.reduce((m, r) => {
      const cur = m.get(r.sourceName) || { responses: 0, matched: 0, presenterIds: [] as string[], sharedWith: [] as string[] };
      cur.responses += 1;
      if (r.presenterId) {
        cur.matched += 1;
        if (!cur.presenterIds.includes(r.presenterId)) cur.presenterIds.push(r.presenterId);
      }
      for (const id of r.sharedWith) if (!cur.sharedWith.includes(id)) cur.sharedWith.push(id);
      return m.set(r.sourceName, cur);
    }, new Map<string, { responses: number; matched: number; presenterIds: string[]; sharedWith: string[] }>()),
  ).map(([name, v]) => ({ name, ...v }));

  // Share links, minted lazily the first time this page loads.
  const links: Record<string, string> = {};
  for (const p of presenters) {
    if (byPresenter.find((b) => b.presenter.id === p.id && b.responseCount > 0)) {
      links[p.id] = await feedbackUrlFor(p.id);
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    overall,
    sources,
    byPresenter,
    unmatched,
    offTopic,
    links,
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const sourceName = searchParams.get("sourceName");
  if (!sourceName) return NextResponse.json({ error: "Which form?" }, { status: 400 });
  const r = await prisma.feedbackResponse.deleteMany({ where: { sourceName } });
  return NextResponse.json({ ok: true, deleted: r.count });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email || null;
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({})) as {
    assign?: { sessionLabel: string; presenterId: string | null };
    hide?: { responseId: string; question: string; hidden: boolean };
    feature?: { responseId: string; question: string; featured: boolean };
    keep?: { responseId: string; question: string; kept: boolean };
    share?: { sourceName: string; presenterIds: string[] };
  };

  if (body.assign) {
    const { sessionLabel, presenterId } = body.assign;
    if (!sessionLabel) return NextResponse.json({ error: "Which label?" }, { status: 400 });
    const r = await prisma.feedbackResponse.updateMany({
      where: { sessionLabel },
      data: { presenterId: presenterId || null },
    });
    return NextResponse.json({ ok: true, updated: r.count });
  }

  if (body.hide) {
    const { responseId, question, hidden } = body.hide;
    const row = await prisma.feedbackResponse.findUnique({
      where: { id: responseId }, select: { hiddenKeys: true, featuredKeys: true },
    });
    if (!row) return NextResponse.json({ error: "No such response." }, { status: 404 });
    const keys = { ...((row.hiddenKeys || {}) as Record<string, unknown>) };
    const picks = { ...((row.featuredKeys || {}) as Record<string, unknown>) };
    if (hidden) {
      // Logged, not silent: who hid it and when travels with the hide.
      keys[question] = { by: email, at: new Date().toISOString() };
      // A hidden comment cannot also be the one quoted at the presenter.
      delete picks[question];
    } else {
      delete keys[question];
    }
    await prisma.feedbackResponse.update({
      where: { id: responseId },
      data: { hiddenKeys: keys as object, featuredKeys: picks as object },
    });
    return NextResponse.json({ ok: true, hiddenKeys: keys });
  }

  if (body.feature) {
    const { responseId, question, featured } = body.feature;
    const row = await prisma.feedbackResponse.findUnique({
      where: { id: responseId }, select: { hiddenKeys: true, featuredKeys: true, keptKeys: true, comments: true },
    });
    if (!row) return NextResponse.json({ error: "No such response." }, { status: 404 });
    const text = String(((row.comments || {}) as Record<string, unknown>)[question] || "");
    if (featured && hiddenFromPresenter(row, question, text)) {
      return NextResponse.json({ error: "That comment is hidden from the speaker. Show it again before featuring it." }, { status: 400 });
    }
    const picks = { ...((row.featuredKeys || {}) as Record<string, unknown>) };
    if (featured) picks[question] = { by: email, at: new Date().toISOString() };
    else delete picks[question];
    await prisma.feedbackResponse.update({ where: { id: responseId }, data: { featuredKeys: picks as object } });
    return NextResponse.json({ ok: true });
  }

  if (body.share) {
    // Set who else presented the session a one-session form is about.
    const { sourceName, presenterIds } = body.share;
    const owners = await prisma.feedbackResponse.findMany({
      where: { sourceName }, select: { presenterId: true }, distinct: ["presenterId"],
    });
    const ownerIds = owners.map((o) => o.presenterId).filter(Boolean) as string[];
    if (ownerIds.length !== 1) {
      return NextResponse.json({
        error: ownerIds.length ? "That form covers several sessions, so it cannot be shared as one." : "Assign the form to a presenter first.",
      }, { status: 400 });
    }
    const confirmed = new Set((await prisma.presenter.findMany({
      where: { status: "confirmed", id: { in: presenterIds || [] } }, select: { id: true },
    })).map((p) => p.id));
    const sharedWith = Array.from(new Set(presenterIds || [])).filter((id) => confirmed.has(id) && id !== ownerIds[0]);
    const r = await prisma.feedbackResponse.updateMany({ where: { sourceName }, data: { sharedWith } });
    return NextResponse.json({ ok: true, updated: r.count, sharedWith });
  }

  if (body.keep) {
    // Show a flagged comment to the speaker after all, or take that back.
    const { responseId, question, kept } = body.keep;
    const row = await prisma.feedbackResponse.findUnique({
      where: { id: responseId }, select: { keptKeys: true, featuredKeys: true },
    });
    if (!row) return NextResponse.json({ error: "No such response." }, { status: 404 });
    const keeps = { ...((row.keptKeys || {}) as Record<string, unknown>) };
    const picks = { ...((row.featuredKeys || {}) as Record<string, unknown>) };
    if (kept) keeps[question] = { by: email, at: new Date().toISOString() };
    else { delete keeps[question]; delete picks[question]; }
    await prisma.feedbackResponse.update({
      where: { id: responseId },
      data: { keptKeys: keeps as object, featuredKeys: picks as object },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Send assign, hide, feature, keep or share." }, { status: 400 });
}
