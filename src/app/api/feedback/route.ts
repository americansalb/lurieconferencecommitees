import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { assemblePresenterFeedback } from "@/lib/feedback";
import { appUrl } from "@/lib/presenters";

// The admin's view of all feedback, and the two corrections they can make:
// assigning unmatched rows to a presenter, and hiding a comment from a share
// page. Comparisons across presenters live here and only here.

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

/** The presenter's share token, minted on first use. */
async function feedbackTokenFor(presenterId: string): Promise<string> {
  const p = await prisma.presenter.findUnique({ where: { id: presenterId }, select: { feedbackToken: true } });
  if (p?.feedbackToken) return p.feedbackToken;
  const token = randomBytes(18).toString("base64url");
  await prisma.presenter.update({ where: { id: presenterId }, data: { feedbackToken: token } });
  return token;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const rows = await prisma.feedbackResponse.findMany({
    orderBy: { importedAt: "asc" },
    select: {
      id: true, sessionLabel: true, presenterId: true,
      ratings: true, comments: true, hiddenKeys: true, submittedAt: true,
    },
  });
  const presenters = await prisma.presenter.findMany({
    where: { status: "confirmed" },
    select: { id: true, name: true, talkTitle: true },
    orderBy: { name: "asc" },
  });

  // Per presenter: full stats and every comment, hidden ones flagged rather
  // than removed, since the admin needs to see what is hidden to unhide it.
  const byPresenter = presenters.map((p) => {
    const mine = rows.filter((r) => r.presenterId === p.id);
    const view = assemblePresenterFeedback(mine);
    const commentRows = mine.flatMap((r) => {
      const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
      return Object.entries((r.comments || {}) as Record<string, string>)
        .filter(([, text]) => (text || "").trim())
        .map(([question, text]) => ({ responseId: r.id, question, text, hidden: !!hidden[question] }));
    });
    return { presenter: p, responseCount: mine.length, questions: view.questions, commentRows };
  });

  // What could not be matched, grouped by label so one assignment fixes the
  // whole group.
  const unmatchedRows = rows.filter((r) => !r.presenterId);
  const unmatched = Array.from(
    unmatchedRows.reduce((m, r) => m.set(r.sessionLabel, (m.get(r.sessionLabel) || 0) + 1), new Map<string, number>()),
  ).map(([label, count]) => ({ label, count }));

  // Share links, minted lazily the first time this page loads.
  const links: Record<string, string> = {};
  for (const p of presenters) {
    if (byPresenter.find((b) => b.presenter.id === p.id && b.responseCount > 0)) {
      links[p.id] = `${appUrl()}/feedback/${await feedbackTokenFor(p.id)}`;
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    byPresenter,
    unmatched,
    links,
  });
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
    const row = await prisma.feedbackResponse.findUnique({ where: { id: responseId }, select: { hiddenKeys: true } });
    if (!row) return NextResponse.json({ error: "No such response." }, { status: 404 });
    const keys = { ...((row.hiddenKeys || {}) as Record<string, unknown>) };
    if (hidden) {
      // Logged, not silent: who hid it and when travels with the hide.
      keys[question] = { by: email, at: new Date().toISOString() };
    } else {
      delete keys[question];
    }
    await prisma.feedbackResponse.update({ where: { id: responseId }, data: { hiddenKeys: keys as object } });
    return NextResponse.json({ ok: true, hiddenKeys: keys });
  }

  return NextResponse.json({ error: "Send assign or hide." }, { status: 400 });
}
