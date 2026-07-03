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
export const ALUMNI_SUBJECT_VARIANTS: SubjectVariant[] = [
  {
    id: "invitation",
    label: "Invitation",
    make: (f) => `${f}, your invitation to the 2026 Lurie Children's & AALB Conference`,
  },
  {
    id: "in-person-or-online",
    label: "In person or online",
    make: (f) => `${f}, we invite you to join us in Chicago, in person or online, this August`,
  },
  {
    id: "formal",
    label: "Formal",
    make: (f) => `An invitation for ${f} to the Second Joint Lurie Children's & AALB Conference`,
  },
  {
    id: "join-us",
    label: "Join us",
    make: (f) => `${f}, you are invited to join us in Chicago on August 15 and 16`,
  },
  {
    id: "dates",
    label: "Formal with dates",
    make: (f) => `${f}, your invitation to join us in Chicago, August 15 and 16`,
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
