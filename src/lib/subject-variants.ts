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

export const ALUMNI_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "warm",
    label: "Warm",
    make: (f) => `${f}, we'd love to see you in Chicago this August`,
  },
  {
    id: "reunion",
    label: "Reunion",
    make: (f) => `${f}, the AALB community is getting together again in Chicago`,
  },
  {
    id: "question",
    label: "Question",
    make: (f) => `${f}, will we see you at this year's AALB & Lurie Children's Conference?`,
  },
  {
    id: "cohort",
    label: "Cohort",
    make: (f) => `${f}, your cohort is heading to Chicago on August 15`,
  },
  {
    id: "direct",
    label: "Direct",
    make: (f) => `${f}, your invitation to join AALB & Lurie Children's in Chicago, August 15 and 16`,
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

export function alumniVariant(id: string | null | undefined): SubjectVariant | null {
  return ALUMNI_SUBJECT_VARIANTS.find((v) => v.id === id) || null;
}
