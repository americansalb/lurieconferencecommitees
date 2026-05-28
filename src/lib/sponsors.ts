import { randomBytes } from "crypto";
import { appUrl } from "./presenters";

export function newSponsorToken() {
  return randomBytes(24).toString("base64url");
}

export function sponsorStatusUrl(token: string) {
  return `${appUrl()}/sponsor/status/${token}`;
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
  variant: "silver" | "gold" | "diamond" | "food" | "asl" | "exhibitor";
  accent: string;
  accentSoft: string;
  acceptsAlternativePayment?: { label: string; note: string };
};

// Pricing and benefits straight from the 2026 Sponsorship & Exhibitor Prospectus.
export const TIERS: SponsorTier[] = [
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
    tagline: "Cover meals for two days of attendees.",
    variant: "food",
    accent: "#92400E",
    accentSoft: "#FEF3C7",
    acceptsAlternativePayment: {
      label: "Donate food instead",
      note: "Food must be vegetarian or vegan. No meat will be served.",
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
    benefits: [
      "Exhibitor table in the conference hall",
      "One conference ticket included",
      "Listing in the conference program",
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
  submitted: { label: "Submitted", color: "bg-slate-100 text-slate-700 border-slate-200" },
  in_conversation: { label: "In conversation", color: "bg-sky-50 text-sky-700 border-sky-200" },
  awaiting_payment: { label: "Awaiting payment", color: "bg-amber-50 text-amber-800 border-amber-200" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800 border-green-300" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const SPONSOR_FROM_NAME_DEFAULT = "Iris Lafitte, AALB Operations Manager";

function extractAddress(s: string): string {
  const angle = s.match(/<([^>]+)>/);
  if (angle) return angle[1].trim();
  return s.trim();
}

export function sponsorFromHeader(): string {
  const baseFrom = process.env.MAIL_FROM?.trim() || "";
  const baseAddr = extractAddress(baseFrom);
  const displayName = (process.env.SPONSOR_FROM_NAME || SPONSOR_FROM_NAME_DEFAULT).replace(/"/g, '\\"');
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
