import { STUDENT_ROSTER_CSV } from "./student-roster";
import { CURRENT_STUDENTS_CSV, CURRENT_STUDENTS_UPDATED } from "./current-students";

// The ten free in-person seats held for AALB alumni and current students.
//
// Eligibility is checked against the rosters we already keep, so somebody who
// trained with us types their email and is recognized rather than being asked to
// prove it. Nobody uploads a certificate.
//
// Two lists, and the order matters. current-students.ts is the short, dated list
// the training team maintains, and it wins: the historical export in
// student-roster.ts was reconciled once, so its idea of who is "currently
// training" is as old as the file. Somebody enrolled today would otherwise be
// read off a snapshot from months ago and told they were a former student.

export const AWARD_COUNT = 10;
export const SCHOLARSHIP_CLOSES = "Sunday, August 10";
export const CURRENT_ROSTER_UPDATED = CURRENT_STUDENTS_UPDATED;

export type Standing = "alumni" | "student" | "former" | "unknown";

export type RosterMatch = {
  standing: Standing;
  firstName: string;
  lastName: string;
  cohort: string | null;
};

/**
 * Emails on the roster, parsed once per process.
 *
 * The roster is a CSV constant of a few thousand rows, so it is parsed lazily
 * and kept: doing it per request would be wasteful, and doing it at import time
 * would cost every page that never asks.
 */
let index: Map<string, RosterMatch> | null = null;

function rosterIndex(): Map<string, RosterMatch> {
  if (index) return index;
  const map = new Map<string, RosterMatch>();

  // Historical export first, so the current list can overwrite anyone in it.
  const lines = STUDENT_ROSTER_CSV.split("\n");
  // Row 0 is the header.
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 3) continue;
    const email = (cols[2] || "").trim().toLowerCase();
    if (!email) continue;
    const template = (cols[5] || "").trim();
    const standing: Standing =
      template === "alumni" ? "alumni"
      : template === "student" ? "student"
      : template === "former-student" ? "former"
      : "unknown";
    // First occurrence wins; the roster is deduped by email already.
    if (!map.has(email)) {
      map.set(email, {
        standing,
        firstName: (cols[0] || "").trim(),
        lastName: (cols[1] || "").trim(),
        cohort: (cols[6] || "").trim() || null,
      });
    }
  }
  // The current enrolments, which override whatever the historical file says.
  // studentId,firstName,lastName,email,cohort
  const current = CURRENT_STUDENTS_CSV.split("\n");
  for (let i = 1; i < current.length; i += 1) {
    const cols = splitCsvLine(current[i]);
    if (cols.length < 4) continue;
    const email = (cols[3] || "").trim().toLowerCase();
    if (!email) continue;
    map.set(email, {
      standing: "student",
      firstName: (cols[1] || "").trim(),
      lastName: (cols[2] || "").trim(),
      cohort: (cols[4] || "").trim() || null,
    });
  }

  index = map;
  return map;
}

/** A CSV line, respecting the quoted fields the roster uses for language lists. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { quoted = false; }
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function lookupRoster(email: string): RosterMatch | null {
  const key = (email || "").trim().toLowerCase();
  if (!key) return null;
  return rosterIndex().get(key) || null;
}

export type EligibilityVerdict = {
  /** Whether the application form opens. */
  eligible: boolean;
  standing: Standing;
  firstName: string;
  lastName: string;
  cohort: string | null;
  /** Shown to the applicant. Written to be read by a person, not a form. */
  message: string;
};

/**
 * Who may apply.
 *
 * Alumni and current students, as set. Someone the roster has as a former
 * student is not turned away outright: the classification means we hold no
 * certificate for them, which is a records problem as often as it is a fact
 * about the person, and telling them to go away over a gap in our own
 * spreadsheet would be wrong. They are pointed at a human instead.
 */
export function checkEligibility(email: string): EligibilityVerdict {
  const match = lookupRoster(email);
  const base = {
    firstName: match?.firstName || "",
    lastName: match?.lastName || "",
    cohort: match?.cohort || null,
  };

  if (match && (match.standing === "alumni" || match.standing === "student")) {
    return {
      ...base,
      eligible: true,
      standing: match.standing,
      message:
        match.standing === "student"
          ? "Found you: currently training with AALB."
          : "Found you: AALB alumni.",
    };
  }

  if (match && match.standing === "former") {
    return {
      ...base,
      eligible: false,
      standing: "former",
      message:
        "We have you as having trained with AALB, but there is no certificate on file for you, so we cannot confirm alumni standing automatically. Email contact@aalb.org and we will check by hand. If your certificate is there, we will open the application for you.",
    };
  }

  return {
    ...base,
    eligible: false,
    standing: "unknown",
    message:
      "We could not find this address on the AALB training roster. These seats are held for AALB alumni and current students. If you trained with us under a different email address, write to contact@aalb.org and tell us which one, and we will look.",
  };
}
