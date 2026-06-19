// Spreadsheet-import helpers shared by the admin Import page (preview) and the
// /api/import route (commit). Pure string work only — safe to import on the
// client. The actual database writes live in the route.

export type ImportType = "attendees" | "exhibitors" | "proposals";

export const IMPORT_TYPES: {
  id: ImportType;
  label: string;
  blurb: string;
  expects: string;
}[] = [
  {
    id: "attendees",
    label: "Attendees (paid)",
    blurb: "Paid registrations → Attendee records marked Paid. $100+ is in-person, less is virtual.",
    expects: "First Name · Last Name · Email · Amount · Status · Timestamp",
  },
  {
    id: "exhibitors",
    label: "Exhibitors",
    blurb: "Exhibitor applications → Sponsor records on the Exhibitor Table tier (not paid).",
    expects: "First Name · Email · Organization name · Phone · Website · Timestamp",
  },
  {
    id: "proposals",
    label: "Proposals (RFP)",
    blurb: "RFP responses → Presenter proposals (status Applied). Existing emails are skipped.",
    expects: "First Name · Email · Title & Abstract · Length · Biography",
  },
];

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  return firstLine.includes("\t") ? "\t" : ",";
}

// Parse delimited text (TSV or CSV) into rows of cells. Handles quoted fields,
// escaped "" quotes, and — importantly for pasted RFP abstracts — newlines
// inside quoted fields.
export function parseTable(text: string, delimiter?: string): string[][] {
  const delim = delimiter || detectDelimiter(text);
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cur += ch; i++; continue;
    }
    if (ch === '"' && cur === "") { inQuotes = true; i++; continue; }
    if (ch === delim) { row.push(cur); cur = ""; i++; continue; }
    if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; i++; continue; }
    cur += ch; i++;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function headerIndex(header: string[], patterns: RegExp[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = (header[i] || "").trim();
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

function looksLikeHeader(row: string[]): boolean {
  const joined = row.join(" ").toLowerCase();
  return /first name|email/.test(joined);
}

function amountToCents(raw: string): number | null {
  const n = Number(String(raw || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function splitTitleAbstract(s: string): { title: string; abstract: string } {
  const text = (s || "").trim();
  if (!text) return { title: "(untitled)", abstract: "" };
  const firstLine = text.split(/\n/)[0].trim();
  let title = firstLine.replace(/^(title|titulo)\s*[:\-–]\s*/i, "").trim();
  if (title.length > 140) title = title.slice(0, 137).trimEnd() + "…";
  return { title: title || "(untitled)", abstract: text };
}

export type AttendeeImport = {
  firstName: string; lastName: string; email: string;
  amountCents: number; mode: "in-person" | "virtual"; paidAt: string | null;
};
export type ExhibitorImport = {
  contactName: string; contactEmail: string; companyName: string;
  contactPhone: string | null; website: string | null; appliedAt: string | null;
};
export type ProposalImport = {
  name: string; email: string; talkTitle: string; talkAbstract: string;
  sessionLength: string | null; bio: string | null;
};

export type ParsedImport =
  | { type: "attendees"; records: AttendeeImport[]; errors: string[] }
  | { type: "exhibitors"; records: ExhibitorImport[]; errors: string[] }
  | { type: "proposals"; records: ProposalImport[]; errors: string[] };

// Turn pasted text into normalized records for a given import type. Returns the
// records plus any per-row errors (skipped rows). Does not touch the database.
export function buildRecords(type: ImportType, text: string): ParsedImport {
  const rows = parseTable(text);
  const errors: string[] = [];
  if (!rows.length) return { type, records: [], errors: ["Nothing to import — paste your rows first."] } as ParsedImport;

  const header = looksLikeHeader(rows[0]) ? rows[0] : null;
  const dataRows = header ? rows.slice(1) : rows;

  if (type === "attendees") {
    const idx = header
      ? {
          first: headerIndex(header, [/first/i]),
          last: headerIndex(header, [/last/i]),
          email: headerIndex(header, [/email/i]),
          amount: headerIndex(header, [/amount/i]),
          paidAt: headerIndex(header, [/time|date/i]),
        }
      : { first: 0, last: 1, email: 2, amount: 4, paidAt: 7 };
    const records: AttendeeImport[] = [];
    dataRows.forEach((r, n) => {
      const firstName = (r[idx.first] || "").trim();
      const lastName = (r[idx.last] || "").trim();
      const email = (r[idx.email] || "").trim().toLowerCase();
      const cents = amountToCents(r[idx.amount] || "");
      if (!isEmail(email)) { errors.push(`Row ${n + 1}: "${r[idx.email] || ""}" is not a valid email — skipped.`); return; }
      if (cents == null) { errors.push(`Row ${n + 1} (${email}): missing/zero amount — skipped.`); return; }
      records.push({
        firstName: firstName || "—",
        lastName,
        email,
        amountCents: cents,
        mode: cents >= 10000 ? "in-person" : "virtual",
        paidAt: (r[idx.paidAt] || "").trim() || null,
      });
    });
    return { type, records, errors };
  }

  if (type === "exhibitors") {
    const idx = header
      ? {
          name: headerIndex(header, [/first name|name/i]),
          email: headerIndex(header, [/email/i]),
          org: headerIndex(header, [/organization|company/i]),
          phone: headerIndex(header, [/phone/i]),
          website: headerIndex(header, [/website|url/i]),
          ts: headerIndex(header, [/time|date/i]),
        }
      : { name: 0, email: 1, org: 3, phone: 4, website: 5, ts: 12 };
    const records: ExhibitorImport[] = [];
    dataRows.forEach((r, n) => {
      const email = (r[idx.email] || "").trim().toLowerCase();
      const company = (r[idx.org] || "").trim();
      if (!isEmail(email)) { errors.push(`Row ${n + 1}: "${r[idx.email] || ""}" is not a valid email — skipped.`); return; }
      if (!company) { errors.push(`Row ${n + 1} (${email}): missing organization — skipped.`); return; }
      records.push({
        contactName: (r[idx.name] || "").trim() || company,
        contactEmail: email,
        companyName: company,
        contactPhone: (r[idx.phone] || "").trim() || null,
        website: (r[idx.website] || "").trim() || null,
        appliedAt: (idx.ts >= 0 ? (r[idx.ts] || "").trim() : "") || null,
      });
    });
    return { type, records, errors };
  }

  // proposals
  const idx = header
    ? {
        name: headerIndex(header, [/first name|name/i]),
        email: headerIndex(header, [/email/i]),
        ta: headerIndex(header, [/title|abstract|presentation/i]),
        len: headerIndex(header, [/length|minutes/i]),
        bio: headerIndex(header, [/biograph|background/i]),
      }
    : { name: 0, email: 1, ta: 2, len: 3, bio: 4 };
  const records: ProposalImport[] = [];
  dataRows.forEach((r, n) => {
    const email = (r[idx.email] || "").trim().toLowerCase();
    const name = (r[idx.name] || "").trim();
    if (!isEmail(email)) { errors.push(`Row ${n + 1}: "${r[idx.email] || ""}" is not a valid email — skipped.`); return; }
    const { title, abstract } = splitTitleAbstract(r[idx.ta] || "");
    records.push({
      name: name || "—",
      email,
      talkTitle: title,
      talkAbstract: abstract,
      sessionLength: (idx.len >= 0 ? (r[idx.len] || "").trim() : "") || null,
      bio: (idx.bio >= 0 ? (r[idx.bio] || "").trim() : "") || null,
    });
  });
  return { type, records, errors };
}

// Best-effort parse of the varied timestamp formats in these exports
// ("2026-03-09T15:37:48.000000Z", "2024-09-27 15:54:05"). Returns null on junk.
export function parseTimestamp(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  // Trim sub-millisecond precision JS can't parse.
  s = s.replace(/(\.\d{3})\d+/, "$1");
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
