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
// actually attended in 2024, and people who only signed up or started a
// checkout. The slots are stable; the copy was rewritten in place after the
// first batch — the original lines read like infomercials ("it is back, and
// bigger", "your seat is still open"). These now match the formal-invitation
// register of the alumni set: institution names, dates, dignity.
// Rewritten again after the queue review: every line opened "FirstName, ..."
// which reads as mail merge when the same stem repeats across an inbox, and
// the copy pitched ("returns", "your seat") instead of informing. These now
// state what, where, and when, like a colleague would. Most drop the name;
// the in-person set keeps one personalized line as its own A/B arm.
//
// AALB leads in every line. This whole roster came through AALB's 2024
// conference; AALB is the name they know, and (same lesson as the alumni
// set above) leading with "Lurie Children's" reads as a stranger's email.
export const RETURNING_PAID_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "ret-paid-back",
    label: "Invited back",
    make: () => `You're invited back: the AALB & Lurie Children's Conference, Aug 15-16`,
  },
  {
    id: "ret-paid-jc",
    label: "JC keynote",
    make: () => `The Joint Commission keynotes AALB's 2026 conference, online or in Chicago`,
  },
  {
    id: "ret-paid-reunion",
    label: "Speaker lineup",
    make: () => `AALB's 2026 speaker lineup is out. 10+ CE hours, August 15-16`,
  },
];
export const RETURNING_LEAD_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "ret-lead-seat",
    label: "Formal invitation",
    make: () => `You're invited: the 2026 AALB & Lurie Children's Conference, Aug 15-16`,
  },
  {
    id: "ret-lead-jc",
    label: "JC keynote",
    make: () => `The Joint Commission keynotes AALB's 2026 language access conference`,
  },
  {
    id: "ret-lead-second",
    label: "It returns",
    make: () => `AALB's conference returns Aug 15-16, in Chicago and online`,
  },
];

// People who were physically in the room in 2024 get Chicago in the subject
// line — the city is the memory. Virtual attendees keep the venue-neutral
// paid set, since "return to Chicago" would ring false to someone who joined
// from home.
export const RETURNING_PAID_INPERSON_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "ret-paid-chi-back",
    label: "Personalized",
    make: (f) => `${f}, AALB invites you back to Lurie Children's, August 15-16`,
  },
  {
    id: "ret-paid-chi-jc",
    label: "JC in Chicago",
    make: () => `The Joint Commission keynotes AALB's conference, August 15-16 in Chicago`,
  },
  {
    id: "ret-paid-chi-return",
    label: "Back to Chicago",
    make: () => `AALB's invitation back to Chicago: August 15-16 at Lurie Children's`,
  },
];

export function pickReturningSubject(
  firstName: string,
  token: string,
  paid: boolean,
  inPerson = false
): { id: string; subject: string } {
  const set = paid
    ? (inPerson ? RETURNING_PAID_INPERSON_SUBJECT_VARIANTS : RETURNING_PAID_SUBJECT_VARIANTS)
    : RETURNING_LEAD_SUBJECT_VARIANTS;
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
    make: (f) => `You trained for this, ${f}. The profession gathers August 15`,
  },
  {
    id: "stu-jc",
    label: "JC keynote",
    make: () => `The Joint Commission is keynoting your profession's conference`,
  },
  {
    id: "stu-seat",
    label: "Seat earned",
    make: (f) => `Your training earned you a seat, ${f}. Chicago or live online`,
  },
];

export function pickStudentSubject(firstName: string, token: string): { id: string; subject: string } {
  const v = STUDENT_SUBJECT_VARIANTS[hashStr(token || "") % STUDENT_SUBJECT_VARIANTS.length];
  return { id: v.id, subject: v.make((firstName || "there").trim()) };
}

// NBCMI registry subject lines. These go to certified medical interpreters we
// have no prior relationship with, so every line is concrete about what this
// is (the conference, the keynoter, the CEU hours, the dates) and none of it
// presumes familiarity with AALB. Same stable-by-token rules: append, never
// reorder or remove.
export const CMI_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "cmi-ceu",
    label: "CEU hours",
    make: (f) => `${f}, over ten CEU hours at the Lurie Children's & AALB conference`,
  },
  {
    id: "cmi-jc",
    label: "JC keynote",
    make: (f) => `${f}, the Joint Commission is keynoting on language access this August`,
  },
  {
    id: "cmi-cred",
    label: "For CMIs",
    make: (f) => `${f}, a conference for certified medical interpreters, August 15-16`,
  },
  {
    id: "cmi-hybrid",
    label: "Chicago or stream",
    make: (f) => `${f}, two days on language access, in Chicago or on the live stream`,
  },
];

export function pickCmiSubject(firstName: string, token: string): { id: string; subject: string } {
  const v = CMI_SUBJECT_VARIANTS[hashStr(token || "") % CMI_SUBJECT_VARIANTS.length];
  return { id: v.id, subject: v.make((firstName || "there").trim()) };
}

export function alumniVariant(id: string | null | undefined): SubjectVariant | null {
  return ALUMNI_SUBJECT_VARIANTS.find((v) => v.id === id) || null;
}
