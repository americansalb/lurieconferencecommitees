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
  /** Share of answers at 4 or 5 (for 1-to-5 scales). */
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
  const topBox = v.filter((x) => x >= 4).length / n;
  let ci95: QuestionStats["ci95"] = null;
  if (sd !== null && sd > 0) {
    const half = t95(n - 1) * (sd / Math.sqrt(n));
    ci95 = { low: mean - half, high: mean + half };
  }
  return { question, n, mean, median, sd, min: v[0], max: v[n - 1], topBox, distribution, ci95 };
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
    const hidden = (r.hiddenKeys || {}) as Record<string, unknown>;
    const comments = (r.comments || {}) as Record<string, unknown>;
    for (const [q, val] of Object.entries(comments)) {
      const text = typeof val === "string" ? val.trim() : "";
      if (!text) continue;
      if (hidden[q]) continue;
      if (!commentMap.has(q)) commentMap.set(q, []);
      commentMap.get(q)!.push(text);
    }
  }
  return {
    responseCount: rows.length,
    questions: Array.from(byQuestion.entries())
      .map(([q, vals]) => questionStats(q, vals))
      .filter((x): x is QuestionStats => !!x),
    comments: Array.from(commentMap.entries()).map(([question, entries]) => ({ question, entries })),
  };
}
