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

export type ExportMode = "in-person" | "virtual";

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
  "Guide sent",
  "Portal",
] as const;

function money(cents: number | null): string {
  if (cents == null) return "";
  if (cents === 0) return "Complimentary";
  return `$${(cents / 100).toFixed(2)}`;
}

function date(d: Date | null): string {
  if (!d) return "";
  // Chicago, because everyone reading this sheet is working to conference time.
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(d);
}

/**
 * Registered attendees for one mode, in the order they signed up.
 *
 * Paid only, and test rows are excluded: a sheet the team works from during the
 * two days should be the people who are actually coming, not the pipeline.
 */
export async function exportRows(mode: ExportMode): Promise<string[][]> {
  const attendees = await prisma.attendee.findMany({
    where: {
      isTest: false,
      paid: true,
      ...(mode === "virtual"
        ? { attendanceMode: "virtual" }
        : { attendanceMode: { not: "virtual" } }),
    },
    orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    select: {
      firstName: true, lastName: true, email: true, phone: true,
      affiliation: true, primaryLanguages: true, attendanceMode: true,
      attendDay: true, paid: true, finalPriceCents: true, paidAt: true,
      createdAt: true, needsParking: true, dietary: true,
      accessibilityNotes: true, notes: true, guideSentAt: true, inviteToken: true,
    },
  });

  return attendees.map((a) => [
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
    a.guideSentAt ? date(a.guideSentAt) : "",
    `${appUrl()}/attend/${a.inviteToken}`,
  ]);
}

/** RFC 4180: quote every field, double any quote inside it. */
export function toCsv(rows: string[][]): string {
  const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
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
