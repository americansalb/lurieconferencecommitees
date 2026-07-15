// Alumni invite subject-line A/B test. Each alumnus is assigned one variant,
// deterministically from their invite token, so the assignment is stable across
// resends and can be recomputed anywhere (server mailer or client dashboard)
// without storing an extra column. The dashboard groups clicks by variant to
// show which line actually earns opens.
//
// Kept in its own module with NO Node imports so it is safe to import into the
// client dashboard bundle (unlike lib/attendees, which pulls in crypto).
//
// Caveat: attribution is derived from token order, so do not reorder or remove
// variants mid-campaign, or already-sent alumni would re-map to a different
// line. Append new ones to the end instead.

export type SubjectVariant = { id: string; label: string; make: (first: string) => string };

// Formal-invitation subject lines. The slots (position and count) are kept
// stable so a token always maps to the same slot; only the copy changed from an
// earlier, cheesier set. Each reads as a dignified invitation to attend in
// person in Chicago or online. Append new ones to the end; do not reorder or
// remove.
//
// These go to AALB alumni, students, and former students — people who know
// AALB, not necessarily Lurie — so every line names AALB up front. Leading
// with "Lurie Children's" read as a stranger's email and went unopened.
export const ALUMNI_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "invitation",
    label: "Joint Commission keynote",
    make: (f) => `${f}, the Joint Commission is keynoting our 2026 AALB conference`,
  },
  {
    id: "in-person-or-online",
    label: "In person or online",
    make: (f) => `${f}, AALB invites you to join us in Chicago, in person or online, this August`,
  },
  {
    id: "formal",
    label: "Standards and enforcement",
    make: (f) => `${f}, the Joint Commission and a former DOJ leader on language access`,
  },
  {
    id: "join-us",
    label: "Join us",
    make: (f) => `${f}, AALB invites you to Chicago on August 15 and 16`,
  },
  {
    id: "dates",
    label: "Formal with dates",
    make: (f) => `${f}, your AALB invitation for Chicago, August 15 and 16`,
  },
];

// Small, stable string hash (FNV-ish via imul) so the same token always lands
// on the same variant, and the spread across variants is roughly even.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickAlumniSubject(firstName: string, token: string): { id: string; subject: string } {
  const v = ALUMNI_SUBJECT_VARIANTS[hashStr(token || "") % ALUMNI_SUBJECT_VARIANTS.length];
  return { id: v.id, subject: v.make((firstName || "there").trim()) };
}

// Reunion invite subject lines for the 2024 conference roster, A/B-tested the
// same way (stable by token; append, never reorder). Two sets: people who
// actually attended in 2024 get "come back" language; people who only signed
// up (or started a checkout) get "the seat you reserved" language.
export const RETURNING_PAID_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "ret-paid-back",
    label: "Come back",
    make: (f) => `${f}, you were there for the first one — come back for the second`,
  },
  {
    id: "ret-paid-jc",
    label: "JC keynotes our reunion",
    make: (f) => `The Joint Commission keynotes our reunion, ${f}`,
  },
  {
    id: "ret-paid-reunion",
    label: "JC at second conference",
    make: (f) => `The Joint Commission is coming to our second conference, ${f}`,
  },
];
export const RETURNING_LEAD_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "ret-lead-seat",
    label: "Seat still open + JC",
    make: () => `Your seat from 2024 is still open — and The Joint Commission is keynoting`,
  },
  {
    id: "ret-lead-jc",
    label: "JC on your conference",
    make: (f) => `${f}, the Joint Commission is keynoting the conference you signed up for`,
  },
  {
    id: "ret-lead-second",
    label: "Back and bigger",
    make: (f) => `${f}, you raised your hand for this in 2024 — it is back, and bigger`,
  },
];

export function pickReturningSubject(firstName: string, token: string, paid: boolean): { id: string; subject: string } {
  const set = paid ? RETURNING_PAID_SUBJECT_VARIANTS : RETURNING_LEAD_SUBJECT_VARIANTS;
  const v = set[hashStr(token || "") % set.length];
  return { id: v.id, subject: v.make((firstName || "there").trim()) };
}

// Student / former-student subject lines, career-first. The first blast sent
// students the formal alumni invitation lines and ~2% clicked; this set leads
// with what the conference does for someone turning training into paid work
// (the hiring room, the standards-writers, the date) instead of ceremony.
// Same stable-by-token rules: append, never reorder or remove.
export const STUDENT_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "stu-hired",
    label: "Hiring room",
    make: (f) => `${f}, this is the room where interpreters get hired`,
  },
  {
    id: "stu-gathers",
    label: "Profession gathers",
    make: (f) => `You trained for this, ${f} — the profession gathers August 15`,
  },
  {
    id: "stu-jc",
    label: "JC keynote",
    make: () => `The Joint Commission is keynoting your profession's conference`,
  },
  {
    id: "stu-seat",
    label: "Seat earned",
    make: (f) => `Your training earned you a seat, ${f} — Chicago or live online`,
  },
];

export function pickStudentSubject(firstName: string, token: string): { id: string; subject: string } {
  const v = STUDENT_SUBJECT_VARIANTS[hashStr(token || "") % STUDENT_SUBJECT_VARIANTS.length];
  return { id: v.id, subject: v.make((firstName || "there").trim()) };
}

export function alumniVariant(id: string | null | undefined): SubjectVariant | null {
  return ALUMNI_SUBJECT_VARIANTS.find((v) => v.id === id) || null;
}
