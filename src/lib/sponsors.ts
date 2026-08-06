import { randomBytes } from "crypto";
import { appUrl } from "./presenters";

export function newSponsorToken() {
  return randomBytes(24).toString("base64url");
}

export function sponsorStatusUrl(token: string) {
  return `${appUrl()}/sponsor/status/${token}`;
}

export function sponsorUnsubscribeUrl(token: string) {
  return `${appUrl()}/api/sponsors/unsubscribe/${token}`;
}

// RFC 8058 one-click unsubscribe headers. Gmail and Yahoo treat a working
// List-Unsubscribe (plus the one-click POST) as a strong deliverability and
// trust signal — and increasingly require it for bulk senders. Always paired
// with a visible unsubscribe link and a postal address in the body.
export function sponsorUnsubHeaders(token: string): Record<string, string> {
  const url = sponsorUnsubscribeUrl(token);
  const mailto = (process.env.MAIL_REPLY_TO?.trim() || "contact@aalb.org");
  return {
    "List-Unsubscribe": `<${url}>, <mailto:${mailto}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export type SponsorTier = {
  id: string;
  name: string;
  amountCents: number;
  amountLabel: string;
  ticketsIncluded: number;
  tagline: string;
  benefits: string[];
  inheritsFrom?: string;
  variant: "supporter" | "silver" | "gold" | "diamond" | "food" | "asl" | "exhibitor";
  accent: string;
  accentSoft: string;
  // In-kind tiers (e.g. Food Sponsor) lead with the donation, not a fee: the
  // whole ask is that a kitchen provide a meal. `valueLabel` frames the dollar
  // figure as the approximate VALUE of that donation (a sense of scale), not a
  // price, and `payAlternative` is the secondary "or just fund it" option.
  inKind?: { action: string; valueLabel: string; requirement: string; payAlternative: string };
  // Invite-only tiers never appear on the public sponsor pages; they exist for
  // deals arranged over email (e.g. the Welcome Kit options offered to an org
  // that can't attend in person). The admin invites them with the tier preset,
  // and the invitation email frames it as "as discussed", not a pitch.
  inviteOnly?: boolean;
  // Closed to new applications. The level still exists, because organizations
  // already signed on at it keep their benefits, their portal and their place
  // on the site; it simply cannot be chosen any more. Shown greyed out with the
  // reason rather than deleted, so a prospect who was sent the prospectus and
  // asks about it gets an answer instead of a page that pretends it never
  // existed. Admins can still invite at a closed level for a deal agreed by
  // email, and anyone already invited can still pay.
  closed?: { label: string; reason: string };
};

// Pricing and benefits straight from the 2026 Sponsorship & Exhibitor Prospectus.
export const TIERS: SponsorTier[] = [
  {
    id: "supporter",
    name: "Supporter",
    amountCents: 45000,
    amountLabel: "$450",
    ticketsIncluded: 0,
    tagline: "Show your support with logo recognition.",
    variant: "supporter",
    accent: "#A56A43",
    accentSoft: "#F5E9DF",
    closed: {
      label: "Closed",
      reason: "The Supporter level is closed for 2026. Printed materials are with the printer, so a logo added now would not make them.",
    },
    benefits: [
      "Logo on the conference website",
      "Logo on printed conference materials",
    ],
  },
  {
    id: "silver",
    name: "Silver Sponsor",
    amountCents: 100000,
    amountLabel: "$1,000",
    ticketsIncluded: 1,
    tagline: "Visibility and recognition at the conference.",
    variant: "silver",
    accent: "#6B7280",
    accentSoft: "#F3F4F6",
    benefits: [
      "Company info and logo on the conference website",
      "Honorable mention during opening remarks",
      "Name and logo displayed during opening remarks",
      "Logo on CEU certificates",
    ],
  },
  {
    id: "gold",
    name: "Gold Sponsor",
    amountCents: 250000,
    amountLabel: "$2,500",
    ticketsIncluded: 2,
    tagline: "Active presence in the program and outreach.",
    variant: "gold",
    accent: "#B8860B",
    accentSoft: "#FEF3C7",
    inheritsFrom: "silver",
    benefits: [
      "Social media thank you posts before and after the event",
      "One flyer or material distributed to all attendees",
      "Half-page conference program ad",
      "Recognition on AALB website for at least 12 months",
      "Named session sponsorship (“sponsored by”)",
    ],
  },
  {
    id: "diamond",
    name: "Diamond Sponsor",
    amountCents: 500000,
    amountLabel: "$5,000",
    ticketsIncluded: 3,
    tagline: "Lead partner. Highest visibility and a seat at the table.",
    variant: "diamond",
    accent: "#0E5566",
    accentSoft: "#E0F2F1",
    inheritsFrom: "gold",
    benefits: [
      "Logo displayed during all conference breaks",
      "Mention in pre- and post-conference emails",
      "One exhibitor table included",
      "Full-page feature in the conference program",
      "Priority exhibitor table placement",
      "Introduce the speaker at your sponsored session",
    ],
  },
  {
    id: "food",
    name: "Food Sponsor",
    amountCents: 175000,
    amountLabel: "$1,750",
    ticketsIncluded: 2,
    tagline: "Donate a plant-based meal for two days of attendees.",
    variant: "food",
    accent: "#92400E",
    accentSoft: "#FEF3C7",
    inKind: {
      action: "Donate a plant-based meal",
      valueLabel: "about $1,750 in value",
      requirement: "Vegetarian or vegan, no meat is served. Even part of a meal goes a long way.",
      payAlternative: "Prefer to fund it instead? You can pay the $1,750 and we will arrange the catering.",
    },
    benefits: [
      "Company info and logo on the conference website",
      "Honorable mention at opening and at lunch service",
      "Name and logo displayed at the conference",
    ],
  },
  {
    id: "asl",
    name: "ASL Interpreter Sponsor",
    amountCents: 250000,
    amountLabel: "$2,500",
    ticketsIncluded: 2,
    tagline: "Underwrite ASL interpretation for the full event.",
    variant: "asl",
    accent: "#6D28D9",
    accentSoft: "#EDE9FE",
    benefits: [
      "Company info and logo on the conference website",
      "Honorable mention during opening remarks",
      "Name and logo displayed at the conference",
      "Social media thank you posts",
      "One flyer or material distributed to attendees",
    ],
  },
  // In-kind accessibility partner (arranged over email, e.g. the National
  // Captioning Institute): live captioning donated for the event. Not on the
  // public pickers (allowlists), no charge; the value is the service.
  {
    id: "captioning",
    name: "Captioning Sponsor",
    amountCents: 0,
    amountLabel: "In kind",
    ticketsIncluded: 2,
    tagline: "Donate live captioning for the full event.",
    variant: "asl",
    accent: "#0E7490",
    accentSoft: "#CFFAFE",
    benefits: [
      "Company info and logo on the conference website",
      "Honorable mention during opening remarks",
      "Name and logo displayed at the conference",
      "Social media thank you posts",
    ],
  },
  {
    id: "exhibitor",
    name: "Exhibitor Table",
    amountCents: 65000,
    amountLabel: "$650",
    ticketsIncluded: 1,
    tagline: "Showcase your products, services, and mission.",
    variant: "exhibitor",
    accent: "#0066B3",
    accentSoft: "#DBEAFE",
    closed: {
      label: "Sold out",
      reason: "Every exhibitor table for 2026 is taken. Email contact@aalb.org to be told first if one frees up.",
    },
    benefits: [
      "Exhibitor table in the conference hall",
      "One conference ticket included",
      "Listing in the conference program",
    ],
  },
  // Invite-only: a remote presence for organizations that can't attend in
  // person, arranged over email (first offered to En-Vision America). Never
  // shown on the public sponsor pages; admins invite with the tier preset.
  {
    id: "welcome-kit",
    name: "Welcome Kit Sponsor",
    amountCents: 20000,
    amountLabel: "$200",
    ticketsIncluded: 0,
    tagline: "Your brochure in every attendee's hands.",
    variant: "supporter",
    accent: "#047857",
    accentSoft: "#D1FAE5",
    inviteOnly: true,
    benefits: [
      "One brochure or promotional insert in the welcome kit given to every in-person attendee",
    ],
  },
  {
    id: "welcome-kit-plus",
    name: "Welcome Kit + Virtual Spotlight",
    amountCents: 30000,
    amountLabel: "$300",
    ticketsIncluded: 0,
    tagline: "In every welcome kit, and in front of the virtual audience.",
    variant: "supporter",
    accent: "#047857",
    accentSoft: "#D1FAE5",
    inviteOnly: true,
    benefits: [
      "One brochure or promotional insert in the welcome kit given to every in-person attendee",
      "A live acknowledgment immediately before the virtual networking session, with your organization's name, website, and contact information shared with virtual attendees",
    ],
  },
];

export function tierById(id: string): SponsorTier | undefined {
  return TIERS.find((t) => t.id === id);
}

// Returns the full benefit list for a tier, walking the inheritance chain so
// "Everything in X, plus..." is expanded into a flat checklist for display.
export function fullBenefits(tierId: string): string[] {
  const t = tierById(tierId);
  if (!t) return [];
  if (!t.inheritsFrom) return t.benefits;
  return [...fullBenefits(t.inheritsFrom), ...t.benefits];
}

export const SPONSOR_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  prospect: { label: "Pending invite", color: "bg-slate-50 text-slate-400 border-slate-200" },
  queued: { label: "Queued", color: "bg-slate-100 text-slate-500 border-slate-200" },
  invited: { label: "Invited", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  submitted: { label: "Submitted", color: "bg-slate-100 text-slate-700 border-slate-200" },
  in_conversation: { label: "In discussion", color: "bg-sky-50 text-sky-700 border-sky-200" },
  awaiting_payment: { label: "Awaiting payment", color: "bg-amber-50 text-amber-800 border-amber-200" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800 border-green-300" },
  confirmed: { label: "Confirmation sent", color: "bg-emerald-600 text-white border-emerald-600" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

// A complimentary exhibitor table: the exhibitor tier offered at no charge,
// created via a "free exhibitor table" invite. amountCents 0 distinguishes it
// from a paid exhibitor; donateFoodInstead is a separate in-kind path.
export function isCompExhibitor(s: { tier: string; amountCents: number; donateFoodInstead?: boolean | null }): boolean {
  return s.tier === "exhibitor" && s.amountCents === 0 && !s.donateFoodInstead;
}

// Organizations that are already official AALB partners. Their invitation
// acknowledges the partnership in the subject and body rather than pitching
// them as if we have no relationship.
const OFFICIAL_PARTNERS = new Set(["amn healthcare language services"]);
export function isOfficialPartner(companyName: string): boolean {
  return OFFICIAL_PARTNERS.has((companyName || "").trim().toLowerCase());
}

// First name for a sponsor greeting. Sponsor rows often carry the organization
// itself (or nothing) in contactName, and a naive split greets "American
// Society for Deaf Children" as "Hi American,". Returns the person's first
// name (skipping honorifics like "Dr.") only when contactName looks like a
// person; otherwise "" so templates fall back to their neutral greeting.
const GREETING_HONORIFIC = /^(dr|mr|mrs|ms|prof|rev|hon|sr|fr)\.?$/i;
export function sponsorFirstName(
  contactName: string | null | undefined,
  companyName?: string | null,
): string {
  const cn = (contactName || "").trim();
  if (!cn) return "";
  const co = (companyName || "").trim().toLowerCase();
  if (co && cn.toLowerCase() === co) return "";
  const toks = cn.replace(/,.*$/, "").trim().split(/\s+/);
  return GREETING_HONORIFIC.test(toks[0]) ? (toks[1] || "") : toks[0];
}

export const SPONSOR_FROM_NAME_DEFAULT = "AALB & Lurie Children's";

// Subject lines lead with the organization's own name (so it catches their eye
// in a crowded inbox) and frame it as a personal invitation, not a blast.
export function sponsorInviteSubject(
  companyName: string,
  opts: { partner?: boolean; comp?: boolean } = {},
): string {
  const co = (companyName || "").trim() || "your organization";
  if (opts.comp) return `${co}: a complimentary exhibitor table at the 2026 Lurie Children's & AALB Conference`;
  if (opts.partner) return `${co}, our official partner: a personal invitation to the 2026 Lurie Children's & AALB Conference`;
  return `${co}: a personal invitation to the 2026 Lurie Children's & AALB Conference`;
}

// A food-sponsor prospect: a restaurant or caterer we are asking to provide an
// in-kind plant-based meal (the conference is fully vegetarian/vegan, no meat
// served). Tagged with the "food" tier, so it receives the dedicated food
// letter and can be filtered apart from the rest of the pipeline.
export function isFoodProspect(s: { tier: string }): boolean {
  return s.tier === "food";
}

// Subject for the restaurant/caterer outreach: a confident invitation to be a
// Food Sponsor, not a plea for food.
export function sponsorFoodSubject(companyName: string): string {
  const co = (companyName || "").trim() || "Your kitchen";
  return `${co}: an invitation to be a Food Sponsor of the 2026 Lurie Children's & AALB Conference`;
}

// An ASL-interpreting prospect: a sign-language interpreting company we are
// asking to donate interpretation in kind. Tagged with the "asl" tier, so it
// receives the dedicated ASL letter and its own pledge funnel.
export function isAslProspect(s: { tier: string }): boolean {
  return s.tier === "asl";
}

// Tiers that actually come with a table in the exhibitor hall. Everything the
// exhibitor guide talks about (load-in, teardown, shipping boxes ahead, when
// the room is busiest) assumes one, so this is the test for whether that guide
// means anything to a given partner.
//
// Added after the exhibitor guide went to a Food Sponsor, whose whole
// involvement is donating a meal: the send only checked that they were
// confirmed, which every in-kind partner also is.
export const TABLE_TIERS = ["exhibitor", "diamond"] as const;

export function sponsorHasTable(s: { tier: string }): boolean {
  return (TABLE_TIERS as readonly string[]).includes(s.tier);
}

// A captioning prospect: an organization donating live captioning in kind.
export function isCaptioningProspect(s: { tier: string }): boolean {
  return s.tier === "captioning";
}

export function sponsorAslSubject(companyName: string): string {
  const co = (companyName || "").trim() || "Your team";
  return `${co}: an invitation to be an ASL Interpreter Sponsor of the 2026 Lurie Children's & AALB Conference`;
}

// Subject while the live request is open. An invitation-shaped subject buries
// the one thing that would make an interpreting agency open this: somebody
// actually needs interpreters, on a named date, soon. So it leads with that
// and leaves the sponsorship framing to the letter.
export function sponsorAslUrgentSubject(companyName: string): string {
  const co = (companyName || "").trim() || "your team";
  return `A Deaf attendee asked us for ASL on August 15. Can ${co} help?`;
}

// Subject for an invite-only (arranged) tier: the deal was agreed over email,
// so the subject confirms it rather than pitching it.
export function sponsorArrangedSubject(companyName: string, tierName: string): string {
  const co = (companyName || "").trim() || "Your organization";
  return `${co}: confirming your ${tierName} sponsorship of the 2026 Lurie Children's & AALB Conference`;
}

// Subject for the in-kind acceptance / welcome letter, sent when an admin
// accepts a pledged Food or ASL sponsor from the dashboard. Leads with the good
// news and the organization's own name.
export function sponsorInKindAcceptanceSubject(companyName: string, kind: "food" | "asl" | "captioning"): string {
  const co = (companyName || "").trim() || "Your organization";
  const role = kind === "asl" ? "ASL Interpreter Sponsor" : kind === "captioning" ? "Captioning Sponsor" : "Food Sponsor";
  return `It's official: ${co} is a ${role} of the 2026 Lurie Children's & AALB Conference`;
}

function extractAddress(s: string): string {
  const angle = s.match(/<([^>]+)>/);
  if (angle) return angle[1].trim();
  return s.trim();
}

export function sponsorFromHeader(): string {
  const baseFrom = process.env.MAIL_FROM?.trim() || "";
  const baseAddr = extractAddress(baseFrom);
  // No commas in From display names (see attendeeFromHeader): mail clients
  // treat them as address separators and split the sender in two.
  const displayName = (process.env.SPONSOR_FROM_NAME || SPONSOR_FROM_NAME_DEFAULT)
    .split(",")[0]
    .trim()
    .replace(/"/g, '\\"');
  const fromAddr = process.env.SPONSOR_FROM_EMAIL?.trim() || baseAddr;
  if (!fromAddr) return baseFrom;
  return `"${displayName}" <${fromAddr}>`;
}

export function sponsorReplyTo(): string | undefined {
  return (
    process.env.SPONSOR_REPLY_TO?.trim() ||
    process.env.MAIL_REPLY_TO?.trim() ||
    undefined
  );
}

// Replies to a sponsor invitation reach BOTH the founder (whose name is on the
// letter) and the shared inbox, so nothing falls through a single person's
// mailbox. Combines kevin@aalb.org with the configured contact address,
// de-duplicated, as a comma-separated Reply-To.
export function sponsorLetterReplyTo(): string {
  const base = sponsorReplyTo() || "contact@aalb.org";
  return Array.from(new Set(["kevin@aalb.org", base.trim()].filter(Boolean))).join(", ");
}
