import { prisma } from "./db";
import {
  buildPresenterReport, displayTalkTitle, isNonAnswer, offTopicReason, questionOrderOf, tallyChoices, titleFromFormName,
  type ChoiceTally, type QuestionStats,
} from "./feedback";
import { feedbackUrlFor } from "./feedback-links";

// Every imported form, compiled for the team: the whole conference, then each
// session, with every comment. This is the one place comments hidden from a
// speaker are still shown (marked as such), because an attendee's complaint
// about CEU credits is exactly what the organizers need to read.
//
// Names and email addresses never leave the raw rows; only mapped answers do.

export type CompiledComment = {
  /** Response number within its session or form, as on the presenter page. */
  n: number;
  question: string;
  text: string;
  /** That response's average on the main scale, when it rated anything. */
  score: number | null;
  /**
   * shown: on the speaker's page. hidden: hidden by hand. offTopic: kept off
   * the speaker's page as not about them. Always "shown" on conference forms.
   */
  status: "shown" | "hidden" | "offTopic";
  reason: string | null;
  featured: boolean;
};

type Ratings = {
  responses: number;
  scale: number;
  overall: number | null;
  /** Share of main-scale answers in the top two points. */
  topTwo: number | null;
  pooled: number[];
  questions: (QuestionStats & { values: number[] })[];
  groups: { name: string; values: number[]; mean: number }[];
};

export type CompiledSession = Ratings & {
  /** Who presented it, as one key: a talk and a panel are separate sessions. */
  id: string;
  title: string;
  presenters: { id: string; name: string; link: string }[];
  forms: string[];
  comments: CompiledComment[];
};

export type CompiledConference = Ratings & {
  form: string;
  choices: ChoiceTally[];
  comments: CompiledComment[];
};

export type CompiledFeedback = {
  totals: { forms: number; responses: number; sessions: number; comments: number; conferenceResponses: number };
  conference: CompiledConference[];
  sessions: CompiledSession[];
  /** Session responses still waiting to be assigned on the Feedback page. */
  unassigned: number;
};

const SELECT = {
  id: true, sourceName: true, presenterId: true, sharedWith: true, general: true,
  ratings: true, comments: true, choices: true, hiddenKeys: true, featuredKeys: true, keptKeys: true,
  questionOrder: true, segment: true,
} as const;

type Row = Awaited<ReturnType<typeof loadRows>>[number];

function loadRows() {
  return prisma.feedbackResponse.findMany({
    orderBy: [{ submittedAt: "asc" }, { importedAt: "asc" }],
    select: SELECT,
  });
}

function ratingsOf(rows: Row[]): Ratings & { report: ReturnType<typeof buildPresenterReport> } {
  const report = buildPresenterReport(rows);
  const { scale, pooled, overall, questions, groups } = report;
  return {
    report,
    responses: rows.length,
    scale,
    overall,
    topTwo: pooled.length ? pooled.filter((v) => v >= scale - 1).length / pooled.length : null,
    pooled,
    questions,
    groups,
  };
}

/** Every real comment on a set of rows, with what the speaker sees of it. */
function commentsOf(rows: Row[], scores: (number | null)[], forSpeaker: boolean): CompiledComment[] {
  const order = questionOrderOf(rows);
  const rank = (q: string) => { const i = order.indexOf(q); return i < 0 ? order.length : i; };
  return rows.flatMap((r, i) => {
    const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
    const kept = (r.keptKeys || {}) as Record<string, unknown>;
    const picks = (r.featuredKeys || {}) as Record<string, unknown>;
    return Object.entries((r.comments || {}) as Record<string, unknown>)
      .filter(([, t]) => typeof t === "string" && t.trim() && !isNonAnswer(t))
      .sort(([a], [b]) => rank(a) - rank(b))
      .map(([question, t]) => {
        const text = (t as string).trim();
        const reason = forSpeaker ? offTopicReason(text) : null;
        const status: CompiledComment["status"] = !forSpeaker ? "shown"
          : hidden[question] ? "hidden"
          : reason && !kept[question] ? "offTopic"
          : "shown";
        return {
          n: i + 1, question, text, score: scores[i] ?? null, status,
          reason: status === "offTopic" ? reason : null,
          featured: status === "shown" && !!picks[question],
        };
      });
  });
}

export async function compileFeedback(): Promise<CompiledFeedback> {
  const rows = await loadRows();
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.presenterId) ids.add(r.presenterId);
    for (const id of r.sharedWith) ids.add(id);
  }
  const people = new Map((await prisma.presenter.findMany({
    where: { id: { in: Array.from(ids) } },
    select: { id: true, name: true, talkTitle: true },
  })).map((p) => [p.id, p]));

  // Sessions: one per group of people who presented together. Somebody who
  // gave a talk and sat on a panel is in two, never one pooled.
  const byCredited = new Map<string, Row[]>();
  for (const r of rows) {
    if (r.general || !r.presenterId) continue;
    const k = [r.presenterId, ...r.sharedWith.filter((id) => id !== r.presenterId).sort()].join("-");
    byCredited.set(k, [...(byCredited.get(k) || []), r]);
  }
  const sessions: CompiledSession[] = [];
  for (const [key, mine] of Array.from(byCredited.entries())) {
    const ownerId = mine[0].presenterId as string;
    const owner = people.get(ownerId);
    const { report, ...stats } = ratingsOf(mine);
    const presenterIds = [ownerId, ...Array.from(new Set(mine.flatMap((r) => r.sharedWith))).filter((id) => id !== ownerId)];
    const shared = presenterIds.length > 1;
    const presenters = [];
    for (const id of presenterIds) {
      const p = people.get(id);
      if (p) presenters.push({ id, name: p.name, link: await feedbackUrlFor(id) });
    }
    sessions.push({
      ...stats,
      id: key,
      // A panel is named by its form; each panelist's own talk title is theirs.
      title: (shared
        ? titleFromFormName(mine[0].sourceName) || displayTalkTitle(owner?.talkTitle)
        : displayTalkTitle(owner?.talkTitle) || titleFromFormName(mine[0].sourceName))
        || `${owner?.name || "Unknown presenter"}'s session`,
      presenters,
      forms: Array.from(new Set(mine.map((r) => r.sourceName))),
      comments: commentsOf(mine, report.responses.map((x) => x.score), true),
    });
  }

  // The whole conference: one entry per general form.
  const byForm = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.general) continue;
    byForm.set(r.sourceName, [...(byForm.get(r.sourceName) || []), r]);
  }
  const conference: CompiledConference[] = Array.from(byForm.entries()).map(([form, mine]) => {
    const { report, ...stats } = ratingsOf(mine);
    const order = questionOrderOf(mine);
    const choiceQuestions = Array.from(new Set(mine.flatMap((r) => Object.keys((r.choices || {}) as object))))
      .sort((a, b) => {
        const ia = order.indexOf(a), ib = order.indexOf(b);
        return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib);
      });
    return {
      ...stats,
      form,
      choices: choiceQuestions.map((q) => tallyChoices(q, mine
        .map((r) => ((r.choices || {}) as Record<string, unknown>)[q])
        .filter((v): v is string => typeof v === "string"))),
      comments: commentsOf(mine, report.responses.map((x) => x.score), false),
    };
  });

  const commentCount = sessions.reduce((a, s) => a + s.comments.length, 0)
    + conference.reduce((a, c) => a + c.comments.length, 0);
  return {
    totals: {
      forms: new Set(rows.map((r) => r.sourceName)).size,
      responses: rows.length,
      sessions: sessions.length,
      comments: commentCount,
      conferenceResponses: conference.reduce((a, c) => a + c.responses, 0),
    },
    conference,
    sessions,
    unassigned: rows.filter((r) => !r.general && !r.presenterId).length,
  };
}

/**
 * Everything as one long CSV: a line per answer, so it pivots in a
 * spreadsheet however someone wants to slice it. Mapped answers only, never
 * the respondent's name or email.
 */
export async function compiledCsv(): Promise<string> {
  const rows = await loadRows();
  const people = new Map((await prisma.presenter.findMany({
    select: { id: true, name: true, talkTitle: true },
  })).map((p) => [p.id, p]));
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [[
    "Form", "About", "Session", "Presenters", "Response", "Question", "Type", "Answer", "Speaker sees it",
  ].map(esc).join(",")];

  const counters = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.sourceName}|${r.presenterId || ""}`;
    const n = (counters.get(key) || 0) + 1;
    counters.set(key, n);
    const owner = r.presenterId ? people.get(r.presenterId) : null;
    const presenters = [r.presenterId, ...r.sharedWith].filter(Boolean)
      .map((id) => people.get(id as string)?.name || "").filter(Boolean).join(", ");
    const about = r.general ? "Whole conference" : owner ? "Session" : "Unassigned";
    const session = r.general ? "" : owner ? (displayTalkTitle(owner.talkTitle) || `${owner.name}'s session`) : "";
    const base = [r.sourceName, about, session, presenters, n];
    const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
    const kept = (r.keptKeys || {}) as Record<string, unknown>;
    const order = r.questionOrder.length ? r.questionOrder : [];
    const rank = (q: string) => { const i = order.indexOf(q); return i < 0 ? order.length : i; };
    const answers: [string, string, string, string][] = [];
    for (const [q, v] of Object.entries((r.ratings || {}) as Record<string, unknown>)) answers.push([q, "Rating", String(v), ""]);
    for (const [q, v] of Object.entries((r.choices || {}) as Record<string, unknown>)) answers.push([q, "Choice", String(v), ""]);
    for (const [q, v] of Object.entries((r.comments || {}) as Record<string, unknown>)) {
      const text = String(v || "").trim();
      if (!text) continue;
      const sees = r.general || !owner ? "" : hidden[q] ? "No, hidden"
        : offTopicReason(text) && !kept[q] ? "No, not about the speaker" : "Yes";
      answers.push([q, "Comment", text, sees]);
    }
    answers.sort((a, b) => rank(a[0]) - rank(b[0]));
    for (const [q, type, answer, sees] of answers) lines.push([...base, q, type, answer, sees].map(esc).join(","));
  }
  return lines.join("\r\n");
}
