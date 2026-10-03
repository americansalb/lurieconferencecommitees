// RID CEUs for the sessions Vancro sponsored: who asked for them, read from
// the session feedback forms, laid out as Vancro's RID CEU Upload Form.
//
// Nothing here knows the forms' wording in advance. The forms kept every
// column of every row (FeedbackResponse.data), so the RID question is found by
// its header: a box for the RID member number, a yes/no about RID CEUs, or a
// "which CEUs do you need" question whose answer names RID. What was read from
// which column is reported back to the team, so a form that asked in some
// other way shows up as "no RID question found" rather than as nobody.
//
// No database in this file; rid-ceu-report.ts does the loading.

import { PROGRAM_DAYS } from "@/components/landing/program-data";

// --- The sponsored sessions ---------------------------------------------------

export type VancroSession = {
  /** "d1-3": day 1, third session that earns credit. */
  key: string;
  day: number;
  /** Position among the day's credit-bearing sessions, as the forms number
   *  them: "Day 2.6" is day 2, sixth session. */
  n: number;
  /** MM/DD/YYYY, as the upload form takes it. */
  date: string;
  time: string;
  title: string;
  who: string;
  minutes: number;
  /** From the scheduled length, until the team enters what Vancro approved. */
  defaultCeus: string;
};

// The program's days are written "Saturday, August 15"; the year is the
// conference's.
const DATES = ["08/15/2026", "08/16/2026"];

/** Every session that earns credit, in program order. There are 13. */
export const VANCRO_SESSIONS: VancroSession[] = PROGRAM_DAYS.flatMap((d, di) =>
  d.sessions
    .filter((s) => s.ceuMinutes)
    .map((s, si) => ({
      key: `d${di + 1}-${si + 1}`,
      day: di + 1,
      n: si + 1,
      date: DATES[di],
      time: `${s.time} to ${s.end}`,
      title: s.title,
      who: s.who || "",
      minutes: s.ceuMinutes as number,
      defaultCeus: ridCeusFor(s.ceuMinutes as number),
    })),
);

/**
 * RID CEUs for a session's length: one CEU is ten contact hours, counted in
 * whole quarter hours, so 60 minutes is 0.1 and 75 is 0.125. Rounded down, so
 * the default never claims more than was scheduled. What Vancro approved for
 * each activity wins; the team enters it on the page.
 */
export function ridCeusFor(minutes: number): string {
  const quarters = Math.floor(minutes / 15);
  return trimNumber(quarters * 0.025);
}

function trimNumber(n: number): string {
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

// --- Matching a form to its session -------------------------------------------

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TITLE_STOP = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "for", "with", "to", "at", "by",
  "language", "access", "session", "panel", "attendance", "feedback", "form",
]);

function titleWords(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2 && !TITLE_STOP.has(w)));
}

/** A presenter's surname, for finding them in a session's "who" line. */
export function surname(name: string): string {
  const words = norm(name.split(",")[0])
    .split(" ")
    .filter((w) => w.length > 1 && !["dr", "phd", "md", "ma", "ms", "mba", "edd", "jr", "sr", "ii", "iii"].includes(w));
  return words[words.length - 1] || "";
}

export type SessionMatch = { key: string; how: "day" | "names" | "title" } | null;

/**
 * Which sponsored session a form's responses are about.
 *
 * Presenters first: a session whose "who" line names every one of them. Wilma
 * Alvarado-Little gave a talk and sat on a panel, so where the names fit more
 * than one session, the form's own "Day 2.6" numbering decides, then its
 * title, then the session with as many people on it as the form credits.
 * Anything still undecided is left for the team to choose on the page.
 */
export function matchVancroSession(input: {
  formName: string;
  title: string | null;
  presenterNames: string[];
}): SessionMatch {
  const day = input.formName.match(/\bDay\s*(\d)\s*\.\s*(\d{1,2})\b/i);
  const byDay = day ? VANCRO_SESSIONS.find((s) => s.day === Number(day[1]) && s.n === Number(day[2])) || null : null;

  const names = input.presenterNames.map(surname).filter(Boolean);
  let candidates = VANCRO_SESSIONS;
  if (names.length) {
    const named = VANCRO_SESSIONS.filter((s) => {
      const who = new Set(norm(s.who.split("·")[0]).split(" "));
      return names.every((n) => n.split(" ").every((w) => who.has(w)));
    });
    if (named.length === 1) return { key: named[0].key, how: "names" };
    if (named.length) candidates = named;
  }

  if (byDay && candidates.includes(byDay)) return { key: byDay.key, how: "day" };

  if (input.title) {
    const want = titleWords(input.title);
    let best: { key: string; score: number } | null = null;
    let tied = false;
    for (const s of candidates) {
      const have = titleWords(s.title);
      if (!want.size || !have.size) continue;
      let overlap = 0;
      want.forEach((w) => { if (have.has(w)) overlap += 1; });
      const score = overlap / Math.min(want.size, have.size);
      if (!best || score > best.score) { best = { key: s.key, score }; tied = false; }
      else if (score === best.score) tied = true;
    }
    if (best && !tied && best.score >= 0.6) return { key: best.key, how: "title" };
  }

  if (names.length && candidates.length < VANCRO_SESSIONS.length) {
    const sameSize = candidates.filter((s) => s.who.split("·")[0].split(/&| and /).length === names.length);
    if (sameSize.length === 1) return { key: sameSize[0].key, how: "names" };
  }
  return null;
}

// --- Reading the RID answer from a form row -----------------------------------

// "RID" in capitals only: "what would you get rid of" is not about RID.
const RID = /\bRID\b/;
// "No." counts, a bare "No" does not: "RID CEUs? (Yes/No)" is not a number box.
const NUMBERISH = /number|#|\bno\.|\bid\b/i;
const CEU_QUESTION = /\bCEUs?\b|continuing education|credential|certif|accredit|\bcredits?\b/i;
const OTHER_BODY = /\b(CCHI|NBCMI|IMIA|ATA|NAJIT|BEI|EIPA|CMI|CHI|CoreCHI)\b/i;
const GENERIC_NUMBER =
  /\b(member(ship)?|licen[cs]e|certification|certificate|credential|ceu)\s*(number|#|no\b\.?|id\b)|\b(member|certification|credential) id\b/i;

export type FormColumns = {
  /** A box that asks for the RID member number. */
  ridNumber: string | null;
  /** Questions that ask whether they want RID CEUs, or which CEUs. */
  asked: string[];
  /** A number box that is not only for RID: "Certification number", or one
   *  shared by several bodies ("Your RID, CCHI or NBCMI number"). */
  genericNumber: string | null;
  lastName: string | null;
  firstName: string | null;
  fullName: string | null;
  email: string | null;
};

/** The columns of a form that matter for RID CEUs, found by their headers. */
export function findColumns(headers: string[]): FormColumns {
  // A box that names CCHI or NBCMI as well as RID holds whichever number the
  // person has, so it is not read as an RID number on its own say-so.
  const ridNumber = headers.find((h) => RID.test(h) && NUMBERISH.test(h) && !OTHER_BODY.test(h)) || null;
  const isGeneric = (h: string) => GENERIC_NUMBER.test(h) || (NUMBERISH.test(h) && RID.test(h) && OTHER_BODY.test(h));
  const genericNumber = headers.find((h) => h !== ridNumber && isGeneric(h)) || null;
  const asked = headers.filter((h) => h !== ridNumber && !isGeneric(h) && (RID.test(h) || CEU_QUESTION.test(h)));
  const lastName = headers.find((h) => /last\s*name|surname|family name|apellido/i.test(h)) || null;
  const firstName = headers.find((h) => /first\s*name|given name/i.test(h)) || null;
  const fullName = headers.find((h) =>
    /\bname\b/i.test(h)
    && h !== lastName && h !== firstName
    && !/presenter|speaker|session|organi[sz]ation|employer|company|agency|institution|hospital|user\s*name|e-?mail|workshop|title/i.test(h),
  ) || null;
  const email = headers.find((h) => /e-?mail/i.test(h)) || null;
  return { ridNumber, asked, genericNumber, lastName, firstName, fullName, email };
}

const NON_ANSWER = /^(none|n\/?a|na|no|nope|not applicable|pending|-+|\.+|x|0+)[.!]*$/i;

/**
 * An RID member number as typed: "#12345", "RID 12345", "12 345". Null when
 * nothing usable was given. RID member numbers are digits; anything else is
 * passed back as given so the team can see it.
 */
export function cleanMemberId(raw: string): { id: string | null; given: string } {
  const given = (raw || "").trim();
  if (!given || NON_ANSWER.test(given)) return { id: null, given: "" };
  const stripped = given.replace(/^(RID\s*)?(member\s*)?(id|number|no\.?|#)?\s*[:#]?\s*/i, "").replace(/[\s#-]/g, "");
  return { id: /^\d{3,8}$/.test(stripped) ? stripped : null, given };
}

const YES = /^(yes|y|si|sí|yes please|i do|please)\b/i;

export type RidAnswer = {
  wants: boolean;
  /** The questions whose answers said so. */
  askedIn: string[];
  /** The member number, when one could be read. */
  memberId: string | null;
  /** What they typed in the number box, if it could not be read. */
  given: string;
  /** Where the number came from, when it was not the RID box itself. */
  numberFrom: "rid" | "answer" | "generic" | null;
  /** They named another body as well, and gave only one number. */
  otherBody: boolean;
  /** A number in a box shared with other bodies, and nothing saying which. */
  unsure: boolean;
  lastName: string;
  lastNameFrom: "column" | "full name" | null;
  fullName: string;
  email: string;
};

/** What one person said about RID CEUs on one form. */
export function readRid(raw: Record<string, string>, cols: FormColumns): RidAnswer {
  const v = (h: string | null) => (h ? (raw[h] || "").trim() : "");

  let wants = false;
  let declined = false;
  let otherBody = false;
  let fromAnswer: string | null = null;
  const askedIn: string[] = [];
  for (const h of cols.asked) {
    const a = v(h);
    if (!a) continue;
    if (RID.test(h)) {
      // "Do you need RID CEUs?" Yes / No.
      if (YES.test(a) || RID.test(a)) { wants = true; askedIn.push(h); }
      else if (/^no\b/i.test(a)) declined = true;
    } else if (RID.test(a)) {
      // "Which CEUs do you need?" CCHI, RID
      wants = true;
      askedIn.push(h);
    }
    if (OTHER_BODY.test(a)) otherBody = true;
    const inline = a.match(/\bRID\b[^0-9]{0,24}(\d{3,8})\b/);
    if (inline && !fromAnswer) fromAnswer = inline[1];
  }

  const box = cleanMemberId(v(cols.ridNumber));
  if (box.id || box.given) wants = wants || !declined;
  // "RID 12345" typed into a shared number box says which body it is.
  const shared = v(cols.genericNumber);
  if (RID.test(shared)) wants = wants || !declined;

  let memberId: string | null = box.id;
  let numberFrom: RidAnswer["numberFrom"] = box.id ? "rid" : null;
  if (!memberId && fromAnswer) { memberId = fromAnswer; numberFrom = "answer"; }
  const g = cleanMemberId(shared);
  if (!memberId && wants && g.id) { memberId = g.id; numberFrom = "generic"; }
  if (OTHER_BODY.test(shared)) otherBody = true;
  const unsure = !wants && !declined && !otherBody && !!g.id && RID.test(cols.genericNumber || "");

  const fullName = [v(cols.firstName), v(cols.lastName)].filter(Boolean).join(" ") || v(cols.fullName);
  let lastName = v(cols.lastName);
  let lastNameFrom: RidAnswer["lastNameFrom"] = lastName ? "column" : null;
  if (!lastName && fullName) { lastName = lastNameOf(fullName); lastNameFrom = lastName ? "full name" : null; }

  return {
    wants: wants && !declined,
    askedIn,
    memberId,
    given: box.id ? "" : box.given || (unsure ? g.given : ""),
    numberFrom,
    otherBody: otherBody && numberFrom === "generic",
    unsure,
    lastName,
    lastNameFrom,
    fullName,
    email: v(cols.email).toLowerCase(),
  };
}

const PARTICLES = new Set(["de", "del", "la", "las", "los", "da", "das", "do", "dos", "di", "van", "von", "der", "den", "le", "st", "st.", "y"]);
const SUFFIX = /^(jr|sr|ii|iii|iv|phd|edd|md|ma|ms|med|mba|nic|ci|ct|cdi|sc:l|nad|bei)\.?$/i;

/**
 * A surname from a name typed in one box. "Jane Doe, NIC" is Doe; "Doe, Jane"
 * is Doe; "Maria de la Cruz" is de la Cruz. A double Spanish surname typed
 * without a hyphen cannot be told from a middle name, which is why the page
 * shows the name as typed next to every surname read this way.
 */
export function lastNameOf(full: string): string {
  let name = full.trim().replace(/\s+/g, " ");
  if (!name) return "";
  const comma = name.indexOf(",");
  if (comma > 0) {
    const before = name.slice(0, comma).trim();
    const after = name.slice(comma + 1).trim();
    // "Doe, Jane": a single word before the comma and a name after it.
    if (!/\s/.test(before) && after && !/^[A-Z][A-Z.:/\-\s,&]*$/.test(after) && !SUFFIX.test(after)) return before;
    name = before;
  }
  // Credentials and suffixes come off the end, but never the last word left
  // after the first name: "Jane Ma" is Ma.
  const words = name.split(" ");
  while (words.length > 2 && SUFFIX.test(words[words.length - 1])) words.pop();
  if (words.length < 2) return words[0] || "";
  let i = words.length - 1;
  while (i > 1 && PARTICLES.has(words[i - 1].toLowerCase())) i -= 1;
  return words.slice(i).join(" ");
}

// --- The upload file ------------------------------------------------------------

export type UploadRow = {
  memberId: string;
  lastName: string;
  workshopId: string;
  date: string;
  ceus: string;
  notes: string;
};

/** Vancro's RID CEU Upload Form: their header, word for word. */
export const UPLOAD_HEADER = ["Member ID", "Last Name", "Workshop ID", "Date", "Ceus", "Notes"];

export function uploadCsv(rows: UploadRow[]): string {
  // Straight quotes only. The template has no byte-order mark, so Excel reads
  // the file as Windows text and a curly apostrophe ("Justice’s", "O’Neil")
  // comes out as three characters of junk.
  const plain = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const cell = (raw: string) => {
    const s = plain(raw);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [UPLOAD_HEADER.join(",")];
  for (const r of rows) {
    lines.push([r.memberId, r.lastName, r.workshopId, r.date, r.ceus, r.notes].map(cell).join(","));
  }
  return lines.join("\n") + "\n";
}
