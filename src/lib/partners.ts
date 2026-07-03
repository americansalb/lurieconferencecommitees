// Curated partner list for the Partner Invitations tab.
//
// Each partner is an organization AALB has a real relationship with (we have
// trained interpreters for them, or they are an official partner) that we want
// to thank at the 2026 conference with three gifts:
//   1. complimentary staff tickets  (a 100%-off attendee code, capped at N uses)
//   2. a shareable attendee discount code  (percent off, unlimited uses)
//   3. a partner discount on an exhibitor table  (default 20% off the $650 tier)
//
// The `intro` is a handcrafted, individually written paragraph, not a template
// line: it names the specific relationship in AALB's own voice. Keep it plain
// text (blank lines split paragraphs); the template escapes and formats it.
//
// A partner is only sendable once `contactEmail` is filled and `ready` is true.

export type Partner = {
  slug: string;
  orgName: string;
  // How the org is referred to mid-sentence and in code prefixes (e.g. "NICC").
  shortName: string;
  // Person to greet; "" greets the organization.
  contactName: string;
  // "" means we do not have the address yet (not sendable).
  contactEmail: string;
  location: string;
  // Complimentary staff seats (the 100%-off code is capped at this many uses).
  freeTickets: number;
  // Shareable attendee code discount, in percent (default 25).
  shareDiscountPct: number;
  // Partner discount on an exhibitor table, in percent (default 20).
  exhibitorDiscountPct: number;
  // The two code strings. Uppercased at send; must match ^[A-Z0-9][A-Z0-9_-]{1,39}$.
  staffCode: string;
  shareCode: string;
  // Handcrafted invitation paragraph(s) in AALB's voice. Blank lines split paras.
  intro: string;
  // Sendable when we have the email and the copy is finalized.
  ready: boolean;
};

export const PARTNERS: Partner[] = [
  {
    slug: "nicc",
    orgName: "Northeastern Iowa Community College Foundation",
    shortName: "NICC",
    contactName: "Alex",
    contactEmail: "Alex@dbqfoundation.org",
    location: "Dubuque, Iowa",
    freeTickets: 2,
    shareDiscountPct: 25,
    exhibitorDiscountPct: 20,
    staffCode: "NICC-STAFF",
    shareCode: "NICC-FRIENDS",
    intro:
      "Over the years, Americans Against Language Barriers has had the privilege of training dozens of interpreters for Northeastern Iowa Community College, and NICC has been an official partner of ours through all of it. That is a rare kind of partnership, and it has put skilled, caring interpreters into the rooms where families in Dubuque and across the region most need to be understood.\n\n" +
      "This August, we are co-hosting our Second Joint Conference with Ann & Robert H. Lurie Children's Hospital of Chicago, on language access in American healthcare, and we did not want to mark it without bringing something back to you.",
    ready: true,
  },

  // --- Awaiting email and/or a finalized relationship line. Not sendable yet. ---
  {
    slug: "irc",
    orgName: "International Rescue Committee",
    shortName: "the IRC",
    contactName: "",
    contactEmail: "",
    location: "",
    freeTickets: 2,
    shareDiscountPct: 25,
    exhibitorDiscountPct: 20,
    staffCode: "IRC-STAFF",
    shareCode: "IRC-FRIENDS",
    intro:
      "Americans Against Language Barriers has had the privilege of training interpreters alongside the International Rescue Committee, work that helps refugee and immigrant families be understood at the moments that matter most.\n\n" +
      "This August, we are co-hosting our Second Joint Conference with Ann & Robert H. Lurie Children's Hospital of Chicago, on language access in American healthcare, and we wanted to bring something back to a partner whose mission is so close to our own.",
    ready: false,
  },
  {
    slug: "alpine-achievers",
    orgName: "Alpine Achievers",
    shortName: "Alpine Achievers",
    contactName: "",
    contactEmail: "",
    location: "",
    freeTickets: 2,
    shareDiscountPct: 25,
    exhibitorDiscountPct: 20,
    staffCode: "ALPINE-STAFF",
    shareCode: "ALPINE-FRIENDS",
    intro: "",
    ready: false,
  },
  {
    slug: "university-hospital-nj",
    orgName: "University Hospital",
    shortName: "University Hospital",
    contactName: "",
    contactEmail: "",
    location: "Newark, New Jersey",
    freeTickets: 2,
    shareDiscountPct: 25,
    exhibitorDiscountPct: 20,
    staffCode: "UHNJ-STAFF",
    shareCode: "UHNJ-FRIENDS",
    intro: "",
    ready: false,
  },
  {
    slug: "rush",
    orgName: "Rush University Medical Center",
    shortName: "Rush",
    contactName: "",
    contactEmail: "",
    location: "Chicago, Illinois",
    freeTickets: 2,
    shareDiscountPct: 25,
    exhibitorDiscountPct: 20,
    staffCode: "RUSH-STAFF",
    shareCode: "RUSH-FRIENDS",
    intro: "",
    ready: false,
  },
];

export function partnerBySlug(slug: string): Partner | undefined {
  return PARTNERS.find((p) => p.slug === slug);
}
