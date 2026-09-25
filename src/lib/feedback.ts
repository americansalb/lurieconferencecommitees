// Attendee feedback about sessions: parsing it, matching it to presenters,
// and the statistics shown on the pages.
//
// The form's shape is not assumed. At import the admin maps the spreadsheet's
// columns: which one names the session (or, for forms where one row rated
// several sessions, which columns belong to which presenter), which columns
// are ratings, which are comments. Storage is always one row = one response
// about one session, so everything downstream is shape-blind.
//
// Presenters see only their own numbers. No conference averages, no rankings:
// a benchmark invites reverse-engineering of colleagues' results, and the
// decision was that each page stands alone. Comparisons live in the admin
// view only.

// --- CSV ---------------------------------------------------------------

/** Parse a whole CSV (quoted fields, embedded newlines) into rows. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cur); cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cur); cur = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

// --- Timestamps ----------------------------------------------------------

const TZ = "America/Chicago";

/** Chicago's offset from UTC, in ms, at a given instant. */
function chicagoOffsetMs(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wall - ms;
}

/**
 * A form's timestamp as the instant it was submitted.
 *
 * Google exports "8/15/2026 10:31:02" with no timezone, meaning the form's own
 * clock, which for this conference is Chicago. `new Date()` would read it as
 * the server's zone, and the servers run in UTC, which put every response five
 * hours early. Anything carrying its own zone (ISO with Z or an offset) is
 * trusted as written.
 */
export function parseFormTimestamp(raw: string): Date | null {
  const s = (raw || "").trim();
  if (!s) return null;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$|T\d/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  let [, mo, d, y, h = "0", mi = "0", sec = "0", ap] = m;
  let year = Number(y);
  if (year < 100) year += 2000;
  let hour = Number(h);
  if (ap) {
    const pm = /p/i.test(ap);
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
  }
  const wall = Date.UTC(year, Number(mo) - 1, Number(d), hour, Number(mi), Number(sec));
  // Two passes settle the offset across a daylight-saving boundary.
  let ms = wall - chicagoOffsetMs(wall);
  ms = wall - chicagoOffsetMs(ms);
  return new Date(ms);
}

// --- Question order ------------------------------------------------------

/**
 * One order for every question across a set of responses: the form's own
 * column order where it was recorded, then anything older imports carry in
 * the order it is first met.
 */
export function questionOrderOf(rows: { questionOrder?: string[] | null; ratings: unknown; comments: unknown }[]): string[] {
  const seen: string[] = [];
  const add = (q: string) => { if (!seen.includes(q)) seen.push(q); };
  for (const r of rows) for (const q of r.questionOrder || []) add(q);
  for (const r of rows) {
    for (const q of Object.keys((r.ratings || {}) as object)) add(q);
    for (const q of Object.keys((r.comments || {}) as object)) add(q);
  }
  return seen;
}

// --- Matching sessions to presenters -----------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "for", "with", "to", "at", "by",
  // Words every feedback label contains without telling us which session it
  // is. "Dr. Alvarado's session" should be judged on "alvarado" alone.
  "dr", "session", "presentation", "talk", "workshop", "keynote", "panel",
  "morning", "afternoon", "saturday", "sunday", "day",
]);

function tokens(s: string): Set<string> {
  // Single letters are dropped too: possessives normalize to a stray "s".
  return new Set(normalize(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w)));
}

export type MatchTarget = { presenterId: string; name: string; talkTitle: string | null };

/**
 * Which presenter a form's session label most plausibly means.
 *
 * Compared on word overlap against both the talk title and the presenter's
 * name, because forms name sessions inconsistently: sometimes the title,
 * sometimes "Dr. Alvarado's session", sometimes both. Below the threshold it
 * returns null and the row waits in the fix-up list; a wrong guess on a page
 * a presenter reads is worse than a gap the admin resolves in one click.
 */
export function matchSessionLabel(label: string, targets: MatchTarget[]): string | null {
  const lt = tokens(label);
  if (!lt.size) return null;
  let best: { id: string; score: number } | null = null;
  for (const t of targets) {
    // Name, title, and both together: a label like "Alvarado's ICU session"
    // shares words with each half but not enough with either alone.
    const candidates = [t.talkTitle || "", t.name, `${t.name} ${t.talkTitle || ""}`].filter(Boolean);
    let score = 0;
    for (const c of candidates) {
      const ct = tokens(c);
      if (!ct.size) continue;
      let overlap = 0;
      lt.forEach((w) => { if (ct.has(w)) overlap += 1; });
      // Overlap relative to the shorter side, so a long form label
      // containing the whole short title still counts as a full match.
      const rel = overlap / Math.min(lt.size, ct.size);
      if (rel > score) score = rel;
    }
    if (!best || score > best.score) best = { id: t.presenterId, score };
  }
  return best && best.score >= 0.6 ? best.id : null;
}

// --- Statistics ---------------------------------------------------------

export type QuestionStats = {
  question: string;
  n: number;
  mean: number;
  median: number;
  /** Sample standard deviation; null when n < 2. */
  sd: number | null;
  min: number;
  max: number;
  /** The top of the scale the question was asked on: 5 or 10. */
  scale: number;
  /** Share of answers in the top two points: 4 or 5, or 9 or 10. */
  topBox: number;
  /** Counts per distinct value, ascending. */
  distribution: { value: number; count: number }[];
  /** 95% confidence interval on the mean; null when n < 2 or sd is 0. */
  ci95: { low: number; high: number } | null;
};

/** Two-sided t critical values at 95% by degrees of freedom (df >= 30 -> 1.96 ~ z). */
function t95(df: number): number {
  const table: Record<number, number> = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
    8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.16, 14: 2.145,
    15: 2.131, 16: 2.12, 17: 2.11, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.08, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.06, 26: 2.056,
    27: 2.052, 28: 2.048, 29: 2.045,
  };
  return df >= 30 ? 1.96 : table[Math.max(1, df)] || 1.96;
}

/**
 * The scale a question was asked on. The question usually says ("How was your
 * experience from 1 to 10?"), and that wins even when nobody happened to
 * answer above 5. Otherwise any answer above 5 means it was out of 10.
 */
export function scaleFor(question: string, max: number): number {
  if (/\b1\s*(?:to|-|–)\s*10\b|out of 10\b|\/\s*10\b/i.test(question)) return 10;
  if (/\b1\s*(?:to|-|–)\s*5\b|out of 5\b|\/\s*5\b/i.test(question)) return 5;
  return max > 5 ? 10 : 5;
}

export function questionStats(question: string, values: number[]): QuestionStats | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return null;
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  const sd = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : null;
  const counts = new Map<number, number>();
  for (const x of v) counts.set(x, (counts.get(x) || 0) + 1);
  const distribution = Array.from(counts.entries()).sort((a, b) => a[0] - b[0]).map(([value, count]) => ({ value, count }));
  const scale = scaleFor(question, v[n - 1]);
  const topBox = v.filter((x) => x >= scale - 1).length / n;
  let ci95: QuestionStats["ci95"] = null;
  if (sd !== null && sd > 0) {
    const half = t95(n - 1) * (sd / Math.sqrt(n));
    ci95 = { low: mean - half, high: mean + half };
  }
  return { question, n, mean, median, sd, min: v[0], max: v[n - 1], scale, topBox, distribution, ci95 };
}

// --- Assembling a presenter's view --------------------------------------

export type PresenterFeedback = {
  responseCount: number;
  questions: QuestionStats[];
  /** Comments per question, hidden ones already removed. */
  comments: { question: string; entries: string[] }[];
};

type Row = {
  id: string;
  ratings: unknown;
  comments: unknown;
  hiddenKeys: unknown;
  featuredKeys?: unknown;
  keptKeys?: unknown;
  questionOrder?: string[] | null;
};

export function assemblePresenterFeedback(rows: Row[]): PresenterFeedback {
  const byQuestion = new Map<string, number[]>();
  const commentMap = new Map<string, string[]>();
  for (const r of rows) {
    const ratings = (r.ratings || {}) as Record<string, unknown>;
    for (const [q, val] of Object.entries(ratings)) {
      const num = typeof val === "number" ? val : Number(val);
      if (!Number.isFinite(num)) continue;
      if (!byQuestion.has(q)) byQuestion.set(q, []);
      byQuestion.get(q)!.push(num);
    }
    const comments = (r.comments || {}) as Record<string, unknown>;
    for (const [q, val] of Object.entries(comments)) {
      const text = typeof val === "string" ? val.trim() : "";
      if (!text) continue;
      if (hiddenFromPresenter(r, q, text)) continue;
      if (!commentMap.has(q)) commentMap.set(q, []);
      commentMap.get(q)!.push(text);
    }
  }
  const order = questionOrderOf(rows);
  const rank = (q: string) => { const i = order.indexOf(q); return i < 0 ? order.length : i; };
  return {
    responseCount: rows.length,
    questions: Array.from(byQuestion.entries())
      .map(([q, vals]) => questionStats(q, vals))
      .filter((x): x is QuestionStats => !!x)
      .sort((a, b) => rank(a.question) - rank(b.question)),
    comments: Array.from(commentMap.entries())
      .map(([question, entries]) => ({ question, entries }))
      .sort((a, b) => rank(a.question) - rank(b.question)),
  };
}

// --- Highlights -------------------------------------------------------------
//
// The comments at the top of a presenter's page, and the one quoted in their
// email, are chosen by a person. They used to be chosen automatically (the
// longest comment from somebody who rated the session 9 or 10), and the first
// test email quoted an attendee's complaint about CEU credits back to the
// presenter as praise. A high rating says nothing about what the comment is
// about. So the software only suggests; nothing is featured until somebody on
// the team stars it.

/** Questions that ask for criticism. Their answers are never suggested. */
const CRITIQUE_QUESTION = /improv|better|change|suggest|dislike|least|wish|missing/i;

// --- Comments that are not about the speaker ------------------------------
//
// An attendee's complaint about CEU credits or the Zoom audio is for us, not
// the presenter, and it is not theirs to read on a page about their talk. These
// are kept off the presenter's page (and out of their CSV and email)
// automatically. Their rating still counts; the comment is simply blank for
// them. The team sees every one on the admin page and can show any of them to
// the speaker after all.
//
// Phrased narrowly on purpose, and checked against real comments: "no room for
// questions", "sound advice" and "the link between policy and practice" are
// about the talk and are left alone.

const OFF_TOPIC: [string, RegExp][] = [
  ["CEUs or certificates", /\bceu'?s?\b|continuing education|credit hours?|\bcredits\b|\bcertificates?\b/i],
  ["The camera or attendance rule", /\bcameras?\b|\battendance\b|\b90\s?%|\bverif(y|ied|ication)\b/i],
  ["Zoom, audio or connection", /\bzoom\b|\baudio\b|internet|connection (issues?|problems?|dropped|was)|breakout rooms?|\bplatform\b|\blagg?(ing|ed|y)\b|\bfroze\b|\bmuted?\b/i],
  ["Registration, payment or email", /registr|sign(?:ed|ing)? up (for|to) the conference|\brefunds?\b|\bpayment\b|\binvoices?\b|\breceipts?\b|(sent|send) (you )?an email|\bemailed you\b/i],
  ["The venue or food", /the room (was|is|felt)|room temperature|\bcold\b|freezing|\bparking\b|\blunch\b|\bcoffee\b|\bbreakfast\b|\bseating\b|\bbathrooms?\b|\brestrooms?\b|\bhotel\b|\belevators?\b|wi-?fi/i],
  ["The schedule", /\bschedule\b|\bagenda\b|break (was|time)/i],
  ["A note to the organizers", /\borganizers?\b|\baalb\b|next year'?s conference|please (address|fix|send me|let me know)/i],
];

/** Why a comment looks like it is not about the speaker, or null if it is. */
export function offTopicReason(text: string): string | null {
  return OFF_TOPIC.find(([, re]) => re.test(text))?.[0] ?? null;
}

/**
 * Whether the presenter should not see this comment: hidden by hand, or
 * flagged as off-topic and not since approved by the team.
 */
export function hiddenFromPresenter(
  r: { hiddenKeys?: unknown; keptKeys?: unknown },
  question: string,
  text: string,
): boolean {
  if (((r.hiddenKeys || {}) as Record<string, unknown>)[question]) return true;
  if (((r.keptKeys || {}) as Record<string, unknown>)[question]) return false;
  return offTopicReason(text) !== null;
}


export type Highlight = { text: string; score: number | null };

/**
 * Comments worth offering as highlights, keyed `${n}|${question}` where n is
 * the response's number. Top-two ratings, not a criticism question, not about
 * logistics, with some substance, longest first. Only ever a suggestion shown
 * to the team.
 */
export function suggestHighlights(
  responses: { n: number; score: number | null; comments: { question: string; text: string }[] }[],
  scale: number,
  limit = 6,
): Set<string> {
  const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
  const pool = responses
    .filter((r) => r.score !== null && r.score >= scale - 1)
    .flatMap((r) => r.comments
      .filter((c) => !CRITIQUE_QUESTION.test(c.question) && !offTopicReason(c.text) && words(c.text) >= 4)
      .map((c) => ({ key: `${r.n}|${c.question}`, words: words(c.text) })));
  return new Set(pool.sort((a, b) => b.words - a.words).slice(0, limit).map((c) => c.key));
}

/**
 * A talk title fit to put in a sentence. Some sessions are recorded as just
 * "Panel" or "Keynote", and "everything people said about Panel" reads as a
 * mistake.
 */
export function displayTalkTitle(title: string | null | undefined): string | null {
  const t = (title || "").trim();
  if (!t || !/\s/.test(t)) return null;
  if (/^(the )?(panel|keynote|session|workshop|presentation|talk|tbd|tba)( discussion| session)?$/i.test(t)) return null;
  return t;
}

// --- Everything a presenter's page shows ------------------------------------

/** Groups smaller than this are left out of the in-person/online split. */
export const MIN_GROUP = 5;

/** The form's own wording is "Virtually" and "In-person in Chicago". */
export function groupName(raw: string): string {
  if (/virtual|online|zoom/i.test(raw)) return "Online";
  if (/in[- ]?person/i.test(raw)) return "In person";
  return raw;
}

/**
 * "None", "N/A", "-": what people type into an optional box to get past it.
 * Not a comment, so it is not shown or counted as one on the presenter page.
 * It stays in the CSV, which is the form's answers as given.
 */
export function isNonAnswer(text: string): boolean {
  return /^(none|n\/?a|na|no|nope|nothing|no comments?|not applicable|x|-+|\.+)[.!]*$/i.test(text.trim());
}

export type PresenterResponse = {
  n: number;
  /** Average of this response's ratings on the main scale. */
  score: number | null;
  ratings: { question: string; value: number; of: number }[];
  comments: { question: string; text: string }[];
};

export type PresenterReport = {
  responseCount: number;
  /** The scale most answers used. The headline numbers use it alone. */
  scale: number;
  questions: (QuestionStats & { values: number[] })[];
  /** Every answer on the main scale, pooled. */
  pooled: number[];
  overall: number | null;
  responses: PresenterResponse[];
  commented: number;
  /** Distinct comment questions with at least one visible answer. */
  commentQuestions: number;
  highlights: Highlight[];
  /** In person against online, only groups of at least MIN_GROUP answers. */
  groups: { name: string; values: number[]; mean: number }[];
};

/**
 * One presenter's feedback, worked out once, for their page and for the
 * email that sends them to it, so the two can never disagree.
 *
 * Hidden comments are dropped here, before anything is shown or sent.
 */
export function buildPresenterReport(rows: (Row & { segment?: string | null })[]): PresenterReport {
  const view = assemblePresenterFeedback(rows);

  // A 1-to-10 score and a 1-to-5 score cannot be averaged together honestly,
  // so the headline uses whichever scale most answers were given on.
  const answersByScale = new Map<number, number>();
  for (const q of view.questions) answersByScale.set(q.scale, (answersByScale.get(q.scale) || 0) + q.n);
  const scale = Array.from(answersByScale.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 5;
  const onMain = new Set(view.questions.filter((q) => q.scale === scale).map((q) => q.question));

  const numeric = (v: unknown) => (typeof v === "number" ? v : Number(v));
  const mainValues = (r: Row) =>
    Object.entries((r.ratings || {}) as Record<string, unknown>)
      .filter(([q, v]) => onMain.has(q) && Number.isFinite(numeric(v)))
      .map(([, v]) => numeric(v));

  const pooled = rows.flatMap(mainValues);
  const overall = pooled.length ? pooled.reduce((a, b) => a + b, 0) / pooled.length : null;

  const questions = view.questions.map((q) => ({
    ...q,
    values: rows
      .map((r) => numeric(((r.ratings || {}) as Record<string, unknown>)[q.question]))
      .filter((v) => Number.isFinite(v)),
  }));

  const order = questionOrderOf(rows);
  const rank = (q: string) => { const i = order.indexOf(q); return i < 0 ? order.length : i; };
  const responses: PresenterResponse[] = rows.map((r, i) => {
    const ratings = (r.ratings || {}) as Record<string, unknown>;
    const mine = mainValues(r);
    return {
      n: i + 1,
      score: mine.length ? mine.reduce((a, b) => a + b, 0) / mine.length : null,
      ratings: view.questions
        .filter((q) => ratings[q.question] != null && Number.isFinite(numeric(ratings[q.question])))
        .map((q) => ({ question: q.question, value: numeric(ratings[q.question]), of: q.scale })),
      comments: Object.entries((r.comments || {}) as Record<string, unknown>)
        .filter(([q, t]) => typeof t === "string" && t.trim() && !isNonAnswer(t) && !hiddenFromPresenter(r, q, t))
        .map(([q, t]) => ({ question: q, text: (t as string).trim() }))
        .sort((a, b) => rank(a.question) - rank(b.question)),
    };
  });

  // Hand-picked highlights, in the order they were picked, so the first one
  // chosen is the one quoted in the email. A hidden comment is never featured.
  const featured: (Highlight & { at: string })[] = [];
  rows.forEach((r, i) => {
    const picks = (r.featuredKeys || {}) as Record<string, { at?: string } | undefined>;
    for (const c of responses[i].comments) {
      if (picks[c.question]) featured.push({ text: c.text, score: responses[i].score, at: picks[c.question]?.at || "" });
    }
  });
  featured.sort((a, b) => a.at.localeCompare(b.at));

  const byGroup = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.segment) continue;
    const g = groupName(r.segment);
    byGroup.set(g, [...(byGroup.get(g) || []), ...mainValues(r)]);
  }
  const groups = Array.from(byGroup.entries())
    .filter(([, v]) => v.length >= MIN_GROUP)
    .map(([name, v]) => ({ name, values: v, mean: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => b.values.length - a.values.length);

  return {
    responseCount: rows.length,
    scale,
    questions,
    pooled,
    overall,
    responses,
    commented: responses.filter((r) => r.comments.length > 0).length,
    commentQuestions: new Set(responses.flatMap((r) => r.comments.map((c) => c.question))).size,
    highlights: featured.map(({ text, score }) => ({ text, score })),
    groups: groups.length >= 2 ? groups : [],
  };
}
