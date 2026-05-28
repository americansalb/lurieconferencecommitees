import { randomBytes } from "crypto";
import { appUrl } from "./presenters";

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
    return { baseCents: base, finalCents: base };
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
  rsvp_pending: { label: "RSVP started", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

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
