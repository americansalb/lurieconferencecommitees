import { randomBytes } from "crypto";
import { appUrl } from "./presenters";
import { attendeeInviteEmail, attendeeAlumniInviteEmail } from "./mail-templates";
import { firstNameToCode } from "./codes";
import { pickAlumniSubject } from "./subject-variants";

export type AttendeeTemplate = "standard" | "alumni";
export const ATTENDEE_TEMPLATES: { id: AttendeeTemplate; label: string; description: string }[] = [
  { id: "standard", label: "Standard invite", description: "Concise personal invitation with the discounted rate." },
  { id: "alumni", label: "AALB alumni", description: "Warm, fully-branded invitation for the AALB community." },
];

// Single source for rendering an attendee invitation, so send / resend /
// preview / view-copy all produce identical output for a given template.
export function buildAttendeeInvite(opts: {
  firstName: string;
  inviteToken: string;
  discountPercent: number;
  inviteMessage?: string | null;
  template?: string | null;
}): { subject: string; html: string; template: AttendeeTemplate; subjectVariant: string | null } {
  const template: AttendeeTemplate = opts.template === "alumni" ? "alumni" : "standard";
  const inPerson = computePrice("in-person", opts.discountPercent);
  const virtual = computePrice("virtual", opts.discountPercent);
  const render = template === "alumni" ? attendeeAlumniInviteEmail : attendeeInviteEmail;
  const html = render({
    firstName: opts.firstName,
    url: attendeeFunnelUrl(opts.inviteToken),
    inviteMessage: opts.inviteMessage ?? null,
    discountPercent: opts.discountPercent,
    inPersonOriginalCents: inPerson.baseCents || 0,
    inPersonDiscountedCents: inPerson.finalCents || 0,
    virtualOriginalCents: virtual.baseCents || 0,
    virtualDiscountedCents: virtual.finalCents || 0,
    personalCode: firstNameToCode(opts.firstName),
    mainSiteUrl: `${appUrl()}/register`,
    // Used by the engraved alumni letter (ignored by the standard invite).
    learnMoreUrl: appUrl(),
    assetBase: appUrl(),
    dateLabel: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  });
  // Alumni sends rotate through several subject lines (A/B), assigned by token
  // so the choice is stable across resends and measurable on the dashboard.
  let subject: string;
  let subjectVariant: string | null = null;
  if (template === "alumni") {
    const picked = pickAlumniSubject(opts.firstName, opts.inviteToken);
    subject = picked.subject;
    subjectVariant = picked.id;
  } else {
    subject = `${opts.firstName}, your invite to the 2026 Lurie Children's & AALB Conference`;
  }
  return { subject, html, template, subjectVariant };
}

// "Personalized" envelope for attendee invitations. The display name appears
// in the recipient's inbox; the actual sending address stays on the
// Resend-verified domain so deliverability isn't affected. Replies route to
// ATTENDEE_REPLY_TO (default: Iris's address derived from ATTENDEE_REPLY_TO
// env, or whatever MAIL_REPLY_TO is set to).
export const ATTENDEE_FROM_NAME_DEFAULT = "Iris Laffitte, AALB Operations Manager";

function extractAddress(s: string): string {
  const angle = s.match(/<([^>]+)>/);
  if (angle) return angle[1].trim();
  return s.trim();
}

export function attendeeFromHeader(): string {
  const baseFrom = process.env.MAIL_FROM?.trim() || "";
  const baseAddr = extractAddress(baseFrom);
  const displayName = (process.env.ATTENDEE_FROM_NAME || ATTENDEE_FROM_NAME_DEFAULT).replace(/"/g, '\\"');
  const fromAddr = process.env.ATTENDEE_FROM_EMAIL?.trim() || baseAddr;
  if (!fromAddr) return baseFrom;
  return `"${displayName}" <${fromAddr}>`;
}

export function attendeeReplyTo(): string | undefined {
  return (
    process.env.ATTENDEE_REPLY_TO?.trim() ||
    process.env.MAIL_REPLY_TO?.trim() ||
    "contact@aalb.org"
  );
}

// Optional archive copy of each invite. We deliberately do NOT hard-code a
// default address: BCC'ing a mailbox that doesn't exist yet (e.g. before
// conference@aalb.org is actually created) makes that address hard-bounce on
// every single send. Resend then suppresses it, and the steady drip of bounces
// drags down the whole sending domain's reputation. Turn this on only once the
// mailbox is real, by setting ATTENDEE_BCC. Kept distinct from the reply-to so
// replies still reach the team at contact@.
export function attendeeBcc(): string | undefined {
  return process.env.ATTENDEE_BCC?.trim() || undefined;
}

export function newAttendeeToken() {
  return randomBytes(24).toString("base64url");
}

export function attendeeFunnelUrl(token: string) {
  return `${appUrl()}/attend/${token}`;
}

// Conference pricing in cents
export const PRICING = {
  inPerson: {
    standardCents: 21000,
  },
  virtual: {
    standardCents: 10500,
  },
};

export function computePrice(mode: string | null | undefined, discountPercent: number) {
  if (mode === "in-person") {
    const base = PRICING.inPerson.standardCents;
    const final = Math.round(base * (100 - discountPercent) / 100);
    return { baseCents: base, finalCents: final };
  }
  if (mode === "virtual") {
    const base = PRICING.virtual.standardCents;
    const final = Math.round(base * (100 - discountPercent) / 100);
    return { baseCents: base, finalCents: final };
  }
  return { baseCents: null, finalCents: null };
}

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const ATTENDEE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "bg-slate-100 text-slate-600 border-slate-200" },
  invited: { label: "Invited", color: "bg-sky-50 text-sky-700 border-sky-200" },
  viewed: { label: "Viewed", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  registered: { label: "Registering", color: "bg-amber-50 text-amber-700 border-amber-200" },
  rsvp_pending: { label: "RSVP started", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

// The funnel stage we actually care about, collapsing the raw status + paid
// flag from both the invited funnel and the public (self-registered) funnel.
export type AttendeeStage = "attending" | "registered" | "invited" | "declined";

export const ATTENDEE_STAGE_LABELS: Record<AttendeeStage, { label: string; color: string; dot: string }> = {
  attending: { label: "Attending", color: "bg-green-100 text-green-800 border-green-300", dot: "#16a34a" },
  registered: { label: "Registering", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "#d97706" },
  invited: { label: "Invited", color: "bg-sky-50 text-sky-700 border-sky-200", dot: "#0284c7" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200", dot: "#e11d48" },
};

export function attendeeStage(a: { paid: boolean; status: string }): AttendeeStage {
  if (a.paid) return "attending";
  if (a.status === "declined") return "declined";
  if (a.status === "registered" || a.status === "confirmed" || a.status === "rsvp_pending") return "registered";
  return "invited"; // queued / invited / viewed
}

// How the person entered the system: we invited/added them, vs they signed up
// on the public site themselves. Invited records carry an invitedById.
export type AttendeeSource = "invited" | "organic";
export function attendeeSource(a: { invitedById?: string | null; invitedAt?: string | null }): AttendeeSource {
  return a.invitedById || a.invitedAt ? "invited" : "organic";
}
export const ATTENDEE_SOURCE_LABELS: Record<AttendeeSource, string> = {
  invited: "Invited",
  organic: "Signed up",
};

// A precise single position in the funnel, so the list answers "have we emailed
// them yet? did they open it? did they pay?" at a glance. attendeeStage() above
// is the coarse 4-bucket version; it lumps queued (not emailed), invited
// (emailed), and viewed (opened) all into "invited", which is exactly what made
// the list unreadable. attendeeStep() keeps those three apart.
export type AttendeeStep =
  | "queued"       // on the list, NOT emailed yet
  | "emailed"      // invite sent, no open
  | "opened"       // opened the invite, no action
  | "registering"  // started checkout / signed up, not paid
  | "attending"    // paid
  | "declined";    // said no

export const ATTENDEE_STEP_LABELS: Record<AttendeeStep, { label: string; blurb: string; color: string; dot: string }> = {
  queued:      { label: "Not emailed", blurb: "On the list, not sent yet", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "#94a3b8" },
  emailed:     { label: "Emailed",     blurb: "Invite sent, awaiting reply", color: "bg-sky-50 text-sky-700 border-sky-200", dot: "#0284c7" },
  opened:      { label: "Opened",      blurb: "Opened the invite, no reply", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "#6366f1" },
  registering: { label: "Registering", blurb: "Started, not paid yet", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "#d97706" },
  attending:   { label: "Attending",   blurb: "Paid and coming", color: "bg-green-100 text-green-800 border-green-300", dot: "#16a34a" },
  declined:    { label: "Declined",    blurb: "Not coming", color: "bg-rose-50 text-rose-700 border-rose-200", dot: "#e11d48" },
};

export function attendeeStep(a: { paid: boolean; status: string }): AttendeeStep {
  if (a.paid) return "attending";
  switch (a.status) {
    case "declined": return "declined";
    case "registered":
    case "rsvp_pending":
    case "confirmed": return "registering";
    case "viewed": return "opened";
    case "invited": return "emailed";
    case "queued":
    default: return "queued";
  }
}

// The one timestamp worth showing for where they are: "Emailed Jun 20",
// "Opened Jun 21", "Added Jun 18". Returns the verb plus the relevant ISO date.
export function attendeeStepMoment(a: {
  paid: boolean; status: string;
  createdAt?: string | null; invitedAt?: string | null; lastSentAt?: string | null;
  viewedAt?: string | null; confirmedAt?: string | null;
}): { verb: string; iso: string | null } {
  switch (attendeeStep(a)) {
    case "attending":   return { verb: "Paid", iso: a.confirmedAt ?? null };
    case "registering": return { verb: "Started", iso: a.viewedAt ?? a.invitedAt ?? a.createdAt ?? null };
    case "opened":      return { verb: "Opened", iso: a.viewedAt ?? null };
    case "emailed":     return { verb: "Emailed", iso: a.lastSentAt ?? a.invitedAt ?? null };
    case "declined":    return { verb: "Declined", iso: a.confirmedAt ?? a.viewedAt ?? null };
    case "queued":
    default:            return { verb: "Added", iso: a.createdAt ?? null };
  }
}


export type CsvParseRow = {
  firstName: string;
  lastName: string;
  email: string;
  affiliation?: string;
  notes?: string;
};

// Parse a pasted block of "FirstName,LastName,Email[,Affiliation][,Notes]" rows.
// Tolerates header row, blank lines, quoted fields.
export function parseAttendeeCsv(input: string): { rows: CsvParseRow[]; errors: string[] } {
  const rows: CsvParseRow[] = [];
  const errors: string[] = [];
  const lines = input.split(/\r?\n/);
  let lineNum = 0;
  for (const raw of lines) {
    lineNum++;
    const line = raw.trim();
    if (!line) continue;
    const cells = parseCsvLine(line);
    if (cells.length < 3) {
      errors.push(`Line ${lineNum}: expected at least 3 columns (first, last, email)`);
      continue;
    }
    const [firstName, lastName, email, affiliation, notes] = cells;
    // Skip header
    if (lineNum === 1 && /first/i.test(firstName) && /last/i.test(lastName) && /email/i.test(email)) {
      continue;
    }
    if (!isEmail(email)) {
      errors.push(`Line ${lineNum}: "${email}" is not a valid email`);
      continue;
    }
    rows.push({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      affiliation: affiliation?.trim() || undefined,
      notes: notes?.trim() || undefined,
    });
  }
  return { rows, errors };
}

// Pull a list of email addresses out of a free-form blob: commas, semicolons,
// spaces, tabs, and newlines all count as separators. Used by the "emails only"
// delivery-test mode, where you just paste addresses with no names. Dedupes
// (case-insensitively) and reports anything that wasn't a valid address.
export function parseEmailList(input: string): { emails: string[]; invalid: string[] } {
  const tokens = (input || "").split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
  const emails: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const e = t.toLowerCase();
    if (!isEmail(e)) { invalid.push(t); continue; }
    if (seen.has(e)) continue;
    seen.add(e);
    emails.push(e);
  }
  return { emails, invalid };
}

// Derive a presentable first/last name from an email local part, so an
// addresses-only paste still produces a sensible greeting. "jane.doe@x.com" ->
// {Jane, Doe}; "test-a8557d@..." -> {Test, ""}. A delivery test mostly hits
// seed mailboxes, so this just needs to read cleanly, not be exact.
export function nameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = (email.split("@")[0] || "").replace(/\+.*$/, "");
  const parts = local.split(/[._\-]+/).filter(Boolean);
  const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : "");
  const first = cap(parts[0] || "Friend");
  const last = parts.length > 1 ? cap(parts[parts.length - 1]) : "";
  return { firstName: first || "Friend", lastName: last };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ""; }
      else if (ch === '"' && cur === "") { inQuotes = true; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
