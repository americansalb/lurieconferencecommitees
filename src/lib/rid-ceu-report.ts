import { prisma } from "./db";
import { questionOrderOf, titleFromFormName } from "./feedback";
import {
  VANCRO_SESSIONS, findColumns, matchVancroSession, readRid, surname,
  type FormColumns, type RidAnswer, type UploadRow,
} from "./rid-ceu";

// The RID CEU list, compiled from every imported feedback form, with the team's
// own entries (Vancro's Workshop IDs, approved CEUs, any form they had to point
// at its session by hand, and which sessions' slides may go to Vancro).
// Server-only; the page reads it through /api/feedback/rid-ceu, and the
// package for Vancro is built from the same compile so the two always agree.
//
// Unlike the compiled feedback, this does read names, emails and member
// numbers out of the raw rows: that list is exactly what Vancro asked for.

const SETTINGS_KEY = "feedback.ridCeu";

export type Release = "send" | "withhold";

export type RidSettings = {
  /** Vancro's Workshop ID for each session, by session key. */
  workshopIds: Record<string, string>;
  /** CEUs Vancro approved, where it differs from the scheduled length. */
  ceus: Record<string, string>;
  /** A form's session chosen by hand, by form key; "none" for not sponsored. */
  forms: Record<string, string>;
  /** Whether a session's slides go to Vancro, where the team overrode the
   *  default (sent when every presenter opted in to continuing education). */
  materials: Record<string, string>;
};

const PARTS = ["workshopIds", "ceus", "forms", "materials"] as const;

export async function getRidSettings(): Promise<RidSettings> {
  const row = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
  let parsed: Partial<RidSettings> = {};
  try { parsed = row ? JSON.parse(row.value) : {}; } catch { parsed = {}; }
  return { workshopIds: parsed.workshopIds || {}, ceus: parsed.ceus || {}, forms: parsed.forms || {}, materials: parsed.materials || {} };
}

/** Merge entries into the saved settings. An empty value removes the entry. */
export async function saveRidSettings(patch: Partial<RidSettings>): Promise<RidSettings> {
  const cur = await getRidSettings();
  for (const part of PARTS) {
    for (const [k, v] of Object.entries(patch[part] || {})) {
      const val = String(v ?? "").trim();
      if (val) cur[part][k] = val; else delete cur[part][k];
    }
  }
  const value = JSON.stringify(cur);
  await prisma.systemSetting.upsert({ where: { key: SETTINGS_KEY }, create: { key: SETTINGS_KEY, value }, update: { value } });
  return cur;
}

export type RidRow = UploadRow & {
  sessionKey: string;
  fullName: string;
  email: string;
  form: string;
  segment: string | null;
  /** Anything about the row worth a second look before it is sent. */
  flags: string[];
};

/** One person, one problem, every session it affects. */
export type RidIssue = {
  /** "number": they asked for RID CEUs and their number is missing or not
   *  a number, so a session they attended is not finished. "check": anything
   *  else worth a look, such as a medical interpreter who clicked Yes to RID. */
  kind: "number" | "check";
  sessionKeys: string[];
  forms: string[];
  name: string;
  email: string;
  given: string;
  reason: string;
};

export type RidForm = {
  key: string;
  form: string;
  presenters: string[];
  general: boolean;
  sessionKey: string | null;
  autoKey: string | null;
  how: "chosen" | "day" | "names" | "title" | null;
  responses: number;
  wanted: number;
  /** Whether the form asked about RID at all, answered or not. */
  asks: boolean;
  /** The questions RID answers were read from, as the form worded them. */
  columns: { label: string; header: string }[];
};

export type SessionPresenter = {
  id: string;
  name: string;
  /** Opted in to continuing education use in the portal, which authorizes
   *  sending approved post-session materials to accrediting bodies. */
  agreedToCe: boolean;
  slide: { href: string; fileName: string | null; sizeBytes: number | null; mime: string | null; linkUrl: string | null } | null;
  abstract: string | null;
};

export type RidSession = (typeof VANCRO_SESSIONS)[number] & {
  ceus: string;
  workshopId: string;
  people: number;
  responses: number;
  presenters: SessionPresenter[];
  /** What the package does with this session's slides. */
  release: Release;
  /** What it would do without the team's override. */
  releaseDefault: Release;
};

export type EvaluationRow = {
  name: string;
  attended: string;
  answers: Record<string, string | number>;
};

export type SessionEvaluation = {
  sessionKey: string;
  questions: string[];
  /** Questions answered on a number scale, for the averages. */
  ratingQuestions: string[];
  rows: EvaluationRow[];
};

export type RidReport = {
  sessions: RidSession[];
  forms: RidForm[];
  rows: RidRow[];
  issues: RidIssue[];
  totals: { rows: number; people: number; sessionsWith: number; issues: number; forms: number; formsAsking: number; responses: number };
};

const most = (counts: Map<string, number> | undefined): string | null =>
  counts ? Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null : null;
const bump = (m: Map<string, Map<string, number>>, k: string, v: string) => {
  const c = m.get(k) || new Map<string, number>();
  c.set(v, (c.get(v) || 0) + 1);
  m.set(k, c);
};

export async function compileRidCeus(): Promise<RidReport> {
  const { evaluations: _unused, ...report } = await compileRidCeusWithEvaluations();
  return report;
}

export async function compileRidCeusWithEvaluations(): Promise<RidReport & { evaluations: SessionEvaluation[] }> {
  const [responses, presenters, settings] = await Promise.all([
    prisma.feedbackResponse.findMany({
      orderBy: [{ submittedAt: "asc" }, { importedAt: "asc" }],
      select: {
        sourceName: true, sessionLabel: true, presenterId: true, sharedWith: true, general: true, data: true, segment: true,
        ratings: true, comments: true, questionOrder: true,
      },
    }),
    prisma.presenter.findMany({
      select: {
        id: true, name: true, talkTitle: true, talkAbstract: true, status: true, agreedToCe: true,
        slide: { select: { fileName: true, mime: true, sizeBytes: true, linkUrl: true } },
      },
    }),
    getRidSettings(),
  ]);
  const people = new Map(presenters.map((p) => [p.id, p]));
  const validKey = new Set(VANCRO_SESSIONS.map((s) => s.key));

  // Each form's columns, from every header any of its rows carries.
  const headersOf = new Map<string, string[]>();
  for (const r of responses) {
    const seen = headersOf.get(r.sourceName) || [];
    for (const h of Object.keys((r.data || {}) as object)) if (!seen.includes(h)) seen.push(h);
    headersOf.set(r.sourceName, seen);
  }
  const colsOf = new Map<string, FormColumns>(Array.from(headersOf.entries()).map(([f, h]) => [f, findColumns(h)]));

  // A form, split by who it credits: most forms are one session, but a form
  // where one row rated several sessions holds several.
  type Answer = { a: RidAnswer; segment: string | null; response: (typeof responses)[number] };
  type Bucket = RidForm & { ids: string[]; answers: Answer[] };
  const buckets = new Map<string, Bucket>();
  for (const r of responses) {
    const ids = r.general ? [] : Array.from(new Set([r.presenterId, ...r.sharedWith].filter(Boolean) as string[])).sort();
    const key = `${r.sourceName}|${r.general ? "general" : ids.join(",") || `label:${r.sessionLabel}`}`;
    let b = buckets.get(key);
    if (!b) {
      const names = ids.map((id) => people.get(id)?.name || "").filter(Boolean);
      const owner = r.presenterId ? people.get(r.presenterId) : null;
      const auto = r.general ? null : matchVancroSession({
        formName: r.sourceName,
        title: titleFromFormName(r.sourceName) || owner?.talkTitle || (r.presenterId ? null : r.sessionLabel),
        presenterNames: names,
      });
      const chosen = settings.forms[key];
      const sessionKey = chosen === "none" ? null : chosen && validKey.has(chosen) ? chosen : auto?.key ?? null;
      b = {
        key, form: r.sourceName, presenters: names, general: r.general, ids,
        sessionKey, autoKey: auto?.key ?? null,
        how: chosen && (chosen === "none" || validKey.has(chosen)) ? "chosen" : auto?.how ?? null,
        responses: 0, wanted: 0, asks: false, columns: [], answers: [],
      };
      buckets.set(key, b);
    }
    b.responses += 1;
    const a = readRid((r.data || {}) as Record<string, string>, colsOf.get(r.sourceName) as FormColumns);
    b.answers.push({ a, segment: r.segment, response: r });
    if (a.wants) b.wanted += 1;
  }

  // One number and one surname per person across every form they filled in.
  // People type their number differently from one form to the next (Cory
  // McMahon gave 52092 three times and 92052 once), and Vancro needs the same
  // number on every line, so the one given most often wins and the others are
  // flagged.
  const personKey = (a: RidAnswer) => a.email || a.fullName.toLowerCase();
  const idCounts = new Map<string, Map<string, number>>();
  const lastCounts = new Map<string, Map<string, number>>();
  Array.from(buckets.values()).forEach((b) => {
    for (const { a } of b.answers) {
      if (!a.wants) continue;
      if (a.memberId && a.numberFrom !== "generic") bump(idCounts, personKey(a), a.memberId);
      if (a.lastName) bump(lastCounts, personKey(a), a.lastName);
    }
  });

  const sessionOf = new Map(VANCRO_SESSIONS.map((s) => [s.key, s]));
  const rows: RidRow[] = [];
  const rawIssues: (Omit<RidIssue, "sessionKeys" | "forms"> & { sessionKey: string | null; form: string })[] = [];
  const inFile = new Set<string>();
  const responsesBySession = new Map<string, number>();
  const presentersBySession = new Map<string, Set<string>>();
  const evalRows = new Map<string, (typeof responses)[number][]>();
  const evalNames = new Map<(typeof responses)[number], { name: string; attended: string }>();

  for (const b of Array.from(buckets.values())) {
    if (b.sessionKey) {
      responsesBySession.set(b.sessionKey, (responsesBySession.get(b.sessionKey) || 0) + b.responses);
      const set = presentersBySession.get(b.sessionKey) || new Set<string>();
      b.ids.forEach((id) => set.add(id));
      presentersBySession.set(b.sessionKey, set);
    }
    const cols = colsOf.get(b.form) as FormColumns;
    // The form's own RID questions, whether or not anyone answered them.
    const used = new Map<string, string>();
    if (cols.bodies) used.set(cols.bodies, "Certifying body");
    if (cols.ridNumber) used.set(cols.ridNumber, "RID number");
    for (const h of cols.asked) if (/\bRID\b/.test(h)) used.set(h, "Asked about RID CEUs");
    if (cols.genericNumber && /\bRID\b/.test(cols.genericNumber)) used.set(cols.genericNumber, "Number, RID or another body");

    for (const { a, segment, response } of b.answers) {
      if (b.sessionKey) {
        evalRows.set(b.sessionKey, [...(evalRows.get(b.sessionKey) || []), response]);
        evalNames.set(response, { name: a.fullName || a.lastName, attended: segment || "" });
      }
      const name = a.fullName || a.lastName;
      const issue = (reason: string, given = a.given, kind: RidIssue["kind"] = "check") =>
        rawIssues.push({ kind, sessionKey: b.sessionKey, form: b.form, name, email: a.email, given, reason });

      if (a.unsure && b.sessionKey) {
        issue(`Gave ${a.given} in "${cols.genericNumber}" without saying which body it is from; add them only if it is an RID number`);
      }
      if (a.mismatch) {
        const typed = a.memberId || a.given;
        issue(`Said Yes to RID${typed ? ` and typed ${typed}` : ""}, but picked only ${a.bodies || "another body"} as certifying body`, typed);
      }
      if (!a.wants) continue;
      for (const h of a.askedIn) if (!used.has(h)) used.set(h, "Which CEUs");

      if (!b.sessionKey) {
        issue(b.general
          ? "Asked on a conference-wide form, which names no session"
          : "On a form not matched to one of the 13 sessions; choose its session under Forms");
        continue;
      }

      const flags: string[] = [];
      const pk = personKey(a);
      const counts = idCounts.get(pk);
      let memberId = most(counts) ?? (a.numberFrom === "generic" ? a.memberId : null);
      if (a.numberFrom === "answer") flags.push("Number read from their written answer");
      if (a.numberFrom === "generic") {
        if (a.otherBody) { issue("Asked for RID and other CEUs but gave one number; check which body it belongs to"); continue; }
        flags.push(`Number from the "${cols.genericNumber}" box`);
        if (cols.genericNumber) used.set(cols.genericNumber, "Certification number");
      }
      if (counts && counts.size > 1) {
        const others = Array.from(counts.keys()).filter((x) => x !== memberId);
        flags.push(`Also typed ${others.join(", ")}; ${memberId} is the number they gave most often`);
      } else if (memberId && !a.memberId && a.numberFrom !== "generic") {
        flags.push("Number from their answer on another form");
      }
      if (!memberId) {
        issue(a.given ? `RID number given as "${a.given}", which is not a member number` : "Asked for RID CEUs but left the RID number blank", a.given, "number");
        continue;
      }

      const lastName = most(lastCounts.get(pk)) || a.lastName;
      if (a.lastNameFrom === "full name" && (a.fullName.includes(",") || a.fullName.trim().split(/\s+/).length > 2)) {
        // "Ana Lopez" can only be read one way; "Ana Maria Lopez Ruiz" or
        // "Lopez, Ana" can be read two.
        flags.push(`Surname read from "${a.fullName}"`);
      }
      if (!lastName) { issue("No name on the response"); continue; }

      const dup = `${b.sessionKey}|${memberId}`;
      if (inFile.has(dup)) continue;
      inFile.add(dup);

      const s = sessionOf.get(b.sessionKey)!;
      const workshopId = settings.workshopIds[s.key] || "";
      rows.push({
        memberId, lastName, workshopId, date: s.date,
        ceus: settings.ceus[s.key] || s.defaultCeus,
        // Without a Workshop ID, the session's name tells Vancro which it was.
        notes: workshopId ? "" : `Session ${String(sessionNumber(s.key)).padStart(2, "0")}: ${s.title}`,
        sessionKey: s.key, fullName: a.fullName, email: a.email, form: b.form, segment, flags,
      });
    }
    b.asks = used.size > 0;
    if (cols.lastName) used.set(cols.lastName, "Last name");
    else if (cols.fullName) used.set(cols.fullName, "Name");
    b.columns = Array.from(used.entries()).map(([header, label]) => ({ label, header }));
  }

  // A problem that another submission of the same person already settled for
  // that session is not a problem. The rest are grouped per person, so someone
  // who made the same slip on twelve forms is one line, not twelve.
  const covered = new Set(rows.flatMap((r) => [
    r.email ? `${r.sessionKey}|${r.email}` : "",
    r.fullName ? `${r.sessionKey}|${r.fullName.toLowerCase()}` : "",
  ].filter(Boolean)));
  const grouped = new Map<string, RidIssue>();
  for (const i of rawIssues) {
    if (i.sessionKey && ((i.email && covered.has(`${i.sessionKey}|${i.email}`)) || (i.name && covered.has(`${i.sessionKey}|${i.name.toLowerCase()}`)))) continue;
    const kind = i.reason.replace(/"[^"]*"|\b\d{3,}\b/g, "");
    const k = `${i.email || i.name.toLowerCase()}|${kind}`;
    const g = grouped.get(k) || { kind: i.kind, sessionKeys: [], forms: [], name: i.name, email: i.email, given: i.given, reason: i.reason };
    if (i.sessionKey && !g.sessionKeys.includes(i.sessionKey)) g.sessionKeys.push(i.sessionKey);
    if (!g.forms.includes(i.form)) g.forms.push(i.form);
    grouped.set(k, g);
  }
  const order = new Map(VANCRO_SESSIONS.map((s, i) => [s.key, i]));
  const issues = Array.from(grouped.values())
    .map((g) => ({ ...g, sessionKeys: g.sessionKeys.sort((x, y) => order.get(x)! - order.get(y)!) }))
    .sort((x, y) => x.name.localeCompare(y.name));

  rows.sort((x, y) => (order.get(x.sessionKey)! - order.get(y.sessionKey)!) || x.lastName.localeCompare(y.lastName));

  // Who presented each session: whoever its forms credit, and failing that,
  // the confirmed presenter whose name and talk fit it.
  for (const p of presenters) {
    if (p.status !== "confirmed") continue;
    const m = matchVancroSession({ formName: "", title: p.talkTitle, presenterNames: [p.name] });
    if (!m || (presentersBySession.get(m.key)?.size ?? 0) > 0) continue;
    presentersBySession.set(m.key, new Set([p.id]));
  }

  const sessions: RidSession[] = VANCRO_SESSIONS.map((s) => {
    // In the order the program names them.
    const who = s.who.split("·")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const at = (name: string) => { const i = who.indexOf(surname(name)); return i < 0 ? who.length : i; };
    const list: SessionPresenter[] = Array.from(presentersBySession.get(s.key) || [])
      .map((id) => people.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        id: p.id,
        name: p.name,
        agreedToCe: p.agreedToCe,
        abstract: p.talkAbstract,
        slide: p.slide && (p.slide.sizeBytes || p.slide.linkUrl)
          ? { href: `/api/presenters/${p.id}/slides`, fileName: p.slide.fileName, sizeBytes: p.slide.sizeBytes, mime: p.slide.mime, linkUrl: p.slide.linkUrl }
          : null,
      }))
      .sort((a, b) => at(a.name) - at(b.name));
    // Slides go to Vancro by default only when every presenter opted in to
    // continuing education use, which is what authorizes sending them.
    const releaseDefault: Release = list.length > 0 && list.every((p) => p.agreedToCe) ? "send" : "withhold";
    const chosen = settings.materials[s.key];
    return {
      ...s,
      ceus: settings.ceus[s.key] || s.defaultCeus,
      workshopId: settings.workshopIds[s.key] || "",
      people: rows.filter((r) => r.sessionKey === s.key).length,
      responses: responsesBySession.get(s.key) || 0,
      presenters: list,
      release: chosen === "send" || chosen === "withhold" ? chosen : releaseDefault,
      releaseDefault,
    };
  });

  // Every evaluation, by session, with who wrote it: the form's own answers,
  // in the form's own question order.
  const evaluations: SessionEvaluation[] = VANCRO_SESSIONS.map((s) => {
    const rs = evalRows.get(s.key) || [];
    const questions = questionOrderOf(rs);
    const ratingQuestions = questions.filter((q) => rs.some((r) => q in ((r.ratings || {}) as object)));
    return {
      sessionKey: s.key,
      questions,
      ratingQuestions,
      // By name, so a person can be found; the order they submitted in means
      // nothing to Vancro.
      rows: rs.map((r) => ({
        name: evalNames.get(r)?.name || "",
        attended: evalNames.get(r)?.attended || "",
        answers: { ...((r.comments || {}) as Record<string, string>), ...((r.ratings || {}) as Record<string, number>) },
      })).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    };
  });

  const forms: RidForm[] = Array.from(buckets.values())
    .map((b) => ({
      key: b.key, form: b.form, presenters: b.presenters, general: b.general,
      sessionKey: b.sessionKey, autoKey: b.autoKey, how: b.how,
      responses: b.responses, wanted: b.wanted, asks: b.asks, columns: b.columns,
    }))
    .sort((a, b) => a.form.localeCompare(b.form, undefined, { numeric: true, sensitivity: "base" }));

  return {
    sessions,
    forms,
    rows,
    issues,
    evaluations,
    totals: {
      rows: rows.length,
      people: new Set(rows.map((r) => r.memberId)).size,
      sessionsWith: sessions.filter((s) => s.people > 0).length,
      issues: issues.length,
      forms: new Set(forms.map((f) => f.form)).size,
      formsAsking: new Set(forms.filter((f) => f.asks).map((f) => f.form)).size,
      responses: responses.length,
    },
  };
}

/** A session's number as the forms number it: 1 to 13 in program order. */
export function sessionNumber(key: string): number {
  return VANCRO_SESSIONS.findIndex((s) => s.key === key) + 1;
}
