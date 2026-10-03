import { prisma } from "./db";
import { titleFromFormName } from "./feedback";
import {
  VANCRO_SESSIONS, findColumns, matchVancroSession, readRid, surname, uploadCsv,
  type FormColumns, type RidAnswer, type UploadRow,
} from "./rid-ceu";

// The RID CEU list, compiled from every imported feedback form, with the team's
// own entries (Vancro's Workshop IDs, approved CEUs, and any form they had to
// point at its session by hand). Server-only; the page reads it through
// /api/feedback/rid-ceu.
//
// Unlike the compiled feedback, this does read names, emails and member
// numbers out of the raw rows: that list is exactly what Vancro asked for.

const SETTINGS_KEY = "feedback.ridCeu";

export type RidSettings = {
  /** Vancro's Workshop ID for each session, by session key. */
  workshopIds: Record<string, string>;
  /** CEUs Vancro approved, where it differs from the scheduled length. */
  ceus: Record<string, string>;
  /** A form's session chosen by hand, by form key; "none" for not sponsored. */
  forms: Record<string, string>;
};

export async function getRidSettings(): Promise<RidSettings> {
  const row = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
  let parsed: Partial<RidSettings> = {};
  try { parsed = row ? JSON.parse(row.value) : {}; } catch { parsed = {}; }
  return { workshopIds: parsed.workshopIds || {}, ceus: parsed.ceus || {}, forms: parsed.forms || {} };
}

/** Merge entries into the saved settings. An empty value removes the entry. */
export async function saveRidSettings(patch: Partial<RidSettings>): Promise<RidSettings> {
  const cur = await getRidSettings();
  for (const part of ["workshopIds", "ceus", "forms"] as const) {
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

export type RidIssue = {
  sessionKey: string | null;
  form: string;
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

export type RidSession = (typeof VANCRO_SESSIONS)[number] & {
  ceus: string;
  workshopId: string;
  people: number;
  responses: number;
  slides: { name: string; href: string }[];
};

export type RidReport = {
  sessions: RidSession[];
  forms: RidForm[];
  rows: RidRow[];
  issues: RidIssue[];
  totals: { rows: number; people: number; sessionsWith: number; issues: number; forms: number; formsAsking: number; responses: number };
};

export async function compileRidCeus(): Promise<RidReport> {
  const [responses, presenters, settings] = await Promise.all([
    prisma.feedbackResponse.findMany({
      orderBy: [{ submittedAt: "asc" }, { importedAt: "asc" }],
      select: { sourceName: true, sessionLabel: true, presenterId: true, sharedWith: true, general: true, data: true, segment: true },
    }),
    prisma.presenter.findMany({
      select: { id: true, name: true, talkTitle: true, status: true, slide: { select: { sizeBytes: true, linkUrl: true } } },
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
  type Bucket = RidForm & { answers: { a: RidAnswer; segment: string | null }[] };
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
        key, form: r.sourceName, presenters: names, general: r.general,
        sessionKey, autoKey: auto?.key ?? null,
        how: chosen && (chosen === "none" || validKey.has(chosen)) ? "chosen" : auto?.how ?? null,
        responses: 0, wanted: 0, asks: false, columns: [], answers: [],
      };
      buckets.set(key, b);
    }
    b.responses += 1;
    const a = readRid((r.data || {}) as Record<string, string>, colsOf.get(r.sourceName) as FormColumns);
    b.answers.push({ a, segment: r.segment });
    if (a.wants) b.wanted += 1;
  }

  // A number someone gave on one form stands in where they left it blank on
  // another, when their email ties the two together and they only ever gave
  // the one number.
  const idsByEmail = new Map<string, Set<string>>();
  const surnameByEmail = new Map<string, string>();
  Array.from(buckets.values()).forEach((b) => {
    for (const { a } of b.answers) {
      if (!a.email) continue;
      if (a.memberId && a.numberFrom !== "generic") {
        idsByEmail.set(a.email, (idsByEmail.get(a.email) || new Set()).add(a.memberId));
      }
      if (a.lastName && a.lastNameFrom === "column" && !surnameByEmail.has(a.email)) surnameByEmail.set(a.email, a.lastName);
    }
  });

  const sessionOf = new Map(VANCRO_SESSIONS.map((s) => [s.key, s]));
  const rows: RidRow[] = [];
  const issues: RidIssue[] = [];
  const inFile = new Set<string>();
  const responsesBySession = new Map<string, number>();

  for (const b of Array.from(buckets.values())) {
    if (b.sessionKey) responsesBySession.set(b.sessionKey, (responsesBySession.get(b.sessionKey) || 0) + b.responses);
    const cols = colsOf.get(b.form) as FormColumns;
    // The form's own RID questions, whether or not anyone answered them.
    const used = new Map<string, string>();
    if (cols.ridNumber) used.set(cols.ridNumber, "RID number");
    for (const h of cols.asked) if (/\bRID\b/.test(h)) used.set(h, "Asked about RID CEUs");

    if (cols.genericNumber && /\bRID\b/.test(cols.genericNumber)) used.set(cols.genericNumber, "Number, RID or another body");

    for (const { a, segment } of b.answers) {
      if (a.unsure && b.sessionKey) {
        issues.push({
          sessionKey: b.sessionKey, form: b.form, name: a.fullName || a.lastName, email: a.email, given: a.given,
          reason: `Gave ${a.given} in "${cols.genericNumber}" without saying which body it is from; add them only if it is an RID number`,
        });
      }
      if (!a.wants) continue;
      for (const h of a.askedIn) if (!used.has(h)) used.set(h, "Which CEUs");
      const name = a.fullName || a.lastName;
      const issue = (reason: string) => issues.push({ sessionKey: b.sessionKey, form: b.form, name, email: a.email, given: a.given, reason });

      if (!b.sessionKey) {
        issue(b.general
          ? "Asked on a conference-wide form, which names no session"
          : "On a form not matched to one of the 13 sessions; choose its session under Forms");
        continue;
      }

      const flags: string[] = [];
      let memberId = a.memberId;
      if (a.numberFrom === "answer") flags.push("Number read from their written answer");
      if (a.numberFrom === "generic") {
        if (a.otherBody) { issue("Asked for RID and other CEUs but gave one number; check which body it belongs to"); continue; }
        flags.push(`Number from the "${cols.genericNumber}" box`);
        if (cols.genericNumber) used.set(cols.genericNumber, "Certification number");
      }
      if (!memberId && a.email) {
        const known = idsByEmail.get(a.email);
        if (known && known.size === 1) {
          memberId = Array.from(known)[0];
          flags.push("Number from their answer on another form");
        }
      }
      if (!memberId) {
        issue(a.given ? `RID number given as "${a.given}", which is not a member number` : "Asked for RID CEUs but left the RID number blank");
        continue;
      }

      let lastName = a.lastName;
      if (a.lastNameFrom === "full name") {
        const better = a.email ? surnameByEmail.get(a.email) : undefined;
        if (better) lastName = better;
        // "Ana Lopez" can only be read one way; "Ana Maria Lopez Ruiz" or
        // "Lopez, Ana" can be read two.
        else if (a.fullName.includes(",") || a.fullName.trim().split(/\s+/).length > 2) flags.push(`Surname read from "${a.fullName}"`);
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
        notes: workshopId ? "" : `Day ${s.day}: ${s.title}`,
        sessionKey: s.key, fullName: a.fullName, email: a.email, form: b.form, segment, flags,
      });
    }
    b.asks = used.size > 0;
    if (cols.lastName) used.set(cols.lastName, "Last name");
    else if (cols.fullName) used.set(cols.fullName, "Name");
    b.columns = Array.from(used.entries()).map(([header, label]) => ({ label, header }));
  }

  // An answer that is in the file under the same session from another
  // submission of the same person is not a problem.
  const covered = new Set(rows.flatMap((r) => [
    r.email ? `${r.sessionKey}|${r.email}` : "",
    r.fullName ? `${r.sessionKey}|${r.fullName.toLowerCase()}` : "",
  ].filter(Boolean)));
  const seenIssue = new Set<string>();
  const openIssues = issues.filter((i) => {
    if (i.sessionKey && ((i.email && covered.has(`${i.sessionKey}|${i.email}`)) || (i.name && covered.has(`${i.sessionKey}|${i.name.toLowerCase()}`)))) return false;
    const k = `${i.sessionKey}|${i.email || i.name}|${i.reason}`;
    if (seenIssue.has(k)) return false;
    seenIssue.add(k);
    return true;
  });

  const order = new Map(VANCRO_SESSIONS.map((s, i) => [s.key, i]));
  rows.sort((x, y) => (order.get(x.sessionKey)! - order.get(y.sessionKey)!) || x.lastName.localeCompare(y.lastName));

  const sessions: RidSession[] = VANCRO_SESSIONS.map((s) => {
    const who = new Set(s.who.split("·")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/));
    const slides = new Map<string, string>();
    for (const p of presenters) {
      if (p.status !== "confirmed" || !(p.slide?.sizeBytes || p.slide?.linkUrl)) continue;
      const last = surname(p.name);
      if (last && who.has(last) && !slides.has(p.name)) slides.set(p.name, `/api/presenters/${p.id}/slides`);
    }
    return {
      ...s,
      ceus: settings.ceus[s.key] || s.defaultCeus,
      workshopId: settings.workshopIds[s.key] || "",
      people: rows.filter((r) => r.sessionKey === s.key).length,
      responses: responsesBySession.get(s.key) || 0,
      slides: Array.from(slides.entries()).map(([name, href]) => ({ name, href })),
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
    issues: openIssues,
    totals: {
      rows: rows.length,
      people: new Set(rows.map((r) => r.memberId)).size,
      sessionsWith: sessions.filter((s) => s.people > 0).length,
      issues: openIssues.length,
      forms: new Set(forms.map((f) => f.form)).size,
      formsAsking: new Set(forms.filter((f) => f.asks).map((f) => f.form)).size,
      responses: responses.length,
    },
  };
}

/** The file for Vancro, in their template's columns. */
export async function ridUploadCsv(): Promise<string> {
  const { rows } = await compileRidCeus();
  return uploadCsv(rows);
}
