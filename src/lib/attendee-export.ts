import { randomBytes } from "crypto";
import { prisma } from "./db";
import { appUrl } from "./presenters";

// The attendee list as a spreadsheet: one sheet for in-person, one for virtual.
//
// Two ways to get it, sharing this one definition so they can never disagree:
//   - a CSV endpoint a Google Sheet pulls with IMPORTDATA, which needs no
//     Google credentials at all
//   - a live push into a named spreadsheet, when a service account is
//     configured (see google-sheets.ts)

export type ExportMode = "in-person" | "virtual" | "all";

/**
 * `paid` is the working list: who is actually coming. `all` is every real
 * attendee record, registered or not, for when the question is about the
 * pipeline rather than the room.
 */
export type ExportScope = "paid" | "all";

export const EXPORT_COLUMNS = [
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Affiliation",
  "Languages",
  "Attending",
  "Days",
  "Paid",
  "Amount",
  "Registered",
  "Parking",
  "Dietary",
  "Accessibility",
  "Notes",
  "Status",
  "How they came",
  "Training session",
  "2024",
  "Discount %",
  "Discount code",
  "Invited",
  "Opened their link",
  "Reminders sent",
  "Guide sent",
  "Chicago guide sent",
  "Unsubscribed",
  "Added",
  "Portal",
] as const;

function money(cents: number | null): string {
  if (cents == null) return "";
  if (cents === 0) return "Complimentary";
  return `$${(cents / 100).toFixed(2)}`;
}

function date(d: Date | null | undefined): string {
  if (!d) return "";
  // Chicago, because everyone reading this sheet is working to conference time.
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(d);
}

/** How many rows are pulled from the database at a time. */
const PAGE = 400;

function whereFor(mode: ExportMode, scope: ExportScope) {
  return {
    isTest: false,
    ...(scope === "paid" ? { paid: true } : {}),
    ...(mode === "virtual"
      ? { attendanceMode: "virtual" }
      : mode === "in-person"
      ? { attendanceMode: { not: "virtual" } }
      : {}),
  };
}

/**
 * Attendees a page at a time, oldest first.
 *
 * Paged rather than loaded whole, and this is not a micro-optimization: the
 * table holds every imported training student and every registry we have ever
 * loaded, so "everyone" is tens of thousands of rows. Reading them all, mapping
 * them to arrays and joining one enormous string held several copies of the
 * whole table in memory at once and took the 512MB instance down.
 *
 * Keyed on id after the sort so paging cannot skip or repeat a row when two
 * records share a timestamp.
 */
export async function* exportRowPages(
  mode: ExportMode,
  scope: ExportScope = "paid",
): AsyncGenerator<string[][]> {
  let cursor: string | null = null;
  for (;;) {
    const attendees: Awaited<ReturnType<typeof fetchPage>> = await fetchPage(mode, scope, cursor);
    if (!attendees.length) return;
    yield attendees.map(toRow);
    if (attendees.length < PAGE) return;
    cursor = attendees[attendees.length - 1].id;
  }
}

async function fetchPage(mode: ExportMode, scope: ExportScope, cursor: string | null) {
  return prisma.attendee.findMany({
    where: whereFor(mode, scope),
    orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    take: PAGE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      firstName: true, lastName: true, email: true, phone: true,
      affiliation: true, primaryLanguages: true, attendanceMode: true,
      attendDay: true, paid: true, finalPriceCents: true, paidAt: true,
      createdAt: true, needsParking: true, dietary: true,
      accessibilityNotes: true, notes: true, guideSentAt: true, inviteToken: true,
      status: true, invitedAt: true, viewedAt: true, nudgeCount: true,
      cohort: true, returning2024: true, discountPercent: true, discountCode: true,
      unsubscribedAt: true, invitedById: true, chicagoGuideSentAt: true,
    },
  });
}

type Row = Awaited<ReturnType<typeof fetchPage>>[number];

function toRow(a: Row): string[] {
  return [
    a.firstName || "",
    a.lastName || "",
    a.email,
    a.phone || "",
    a.affiliation || "",
    a.primaryLanguages || "",
    a.attendanceMode === "virtual" ? "Virtual" : "In person",
    a.attendDay === "sat" ? "Saturday only" : a.attendDay === "sun" ? "Sunday only" : "Both days",
    a.paid ? "Yes" : "No",
    money(a.finalPriceCents),
    date(a.paidAt || a.createdAt),
    a.needsParking === true ? "Yes" : a.needsParking === false ? "No" : "",
    a.dietary || "",
    a.accessibilityNotes || "",
    a.notes || "",
    a.status || "",
    // Somebody we added and mailed, or somebody who found the site themselves.
    a.invitedById ? "We invited them" : "Signed up themselves",
    a.cohort || "",
    a.returning2024 === "paid" ? "Attended 2024"
      : a.returning2024 === "attempted" ? "Started 2024, did not finish"
      : a.returning2024 === "lead" ? "2024 lead"
      : "",
    a.discountPercent ? String(a.discountPercent) : "",
    a.discountCode || "",
    date(a.invitedAt),
    date(a.viewedAt),
    a.nudgeCount ? String(a.nudgeCount) : "",
    date(a.guideSentAt),
    date(a.chicagoGuideSentAt),
    a.unsubscribedAt ? date(a.unsubscribedAt) : "",
    date(a.createdAt),
    `${appUrl()}/attend/${a.inviteToken}`,
  ];
}

/**
 * Every row at once. Only safe for the paid list, which is the room rather than
 * the database, and is what the Google Sheet writes.
 */
export async function exportRows(mode: ExportMode, scope: ExportScope = "paid"): Promise<string[][]> {
  const out: string[][] = [];
  for await (const page of exportRowPages(mode, scope)) out.push(...page);
  return out;
}

/** RFC 4180: quote every field, double any quote inside it. */
export function csvLine(row: string[]): string {
  return row.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(",");
}

// The CSV endpoint is read by Google's servers, which cannot log in, so it
// carries its own long random token instead. Stored rather than configured, so
// nobody has to set an environment variable to use the feature, and rotatable
// from the admin page if a sheet is ever shared too widely.
const TOKEN_KEY = "attendee_export_token";

export async function exportToken(): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key: TOKEN_KEY } });
  if (row?.value) return row.value;
  const token = randomBytes(24).toString("base64url");
  await prisma.systemSetting.upsert({
    where: { key: TOKEN_KEY },
    create: { key: TOKEN_KEY, value: token },
    update: { value: token },
  });
  return token;
}

export async function rotateExportToken(): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await prisma.systemSetting.upsert({
    where: { key: TOKEN_KEY },
    create: { key: TOKEN_KEY, value: token },
    update: { value: token },
  });
  return token;
}

export async function tokenIsValid(candidate: string | null): Promise<boolean> {
  if (!candidate) return false;
  const row = await prisma.systemSetting.findUnique({ where: { key: TOKEN_KEY } });
  return !!row?.value && row.value === candidate;
}

/** The formula to paste into a Google Sheet tab. */
export function importFormula(mode: ExportMode, token: string): string {
  return `=IMPORTDATA("${appUrl()}/api/attendees/export?mode=${mode}&token=${token}")`;
}
