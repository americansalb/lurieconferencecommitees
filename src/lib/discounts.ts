import { prisma } from "@/lib/db";
import type { DiscountCode } from "@prisma/client";
import { firstNameToCode } from "@/lib/codes";

// Ensure a recipient's personal first-name discount code exists (idempotent).
// Called whenever we email an attendee invite so the same percentage is
// redeemable on the public site, not just baked into their personal link.
// Two people with the same first name share one code: if it already exists we
// leave it untouched.
export async function ensureFirstNameCode(
  firstName: string,
  percent: number,
  createdByEmail?: string | null,
): Promise<string | null> {
  const code = firstNameToCode(firstName);
  const pct = Math.round(percent);
  if (!code || pct <= 0) return null;
  await prisma.discountCode.upsert({
    where: { code },
    create: {
      code,
      description: "Personal invite code (auto-created)",
      kind: "percent",
      inPersonValue: Math.min(100, pct),
      virtualValue: Math.min(100, pct),
      active: true,
      createdByEmail: createdByEmail || null,
    },
    update: {}, // duplicate first names keep the existing code unchanged
  });
  return code;
}

// Shared campaign code for the NBCMI registry outreach: one memorable code
// for the whole cohort ("CertifiedNBCMI"), stored uppercase so the funnel's
// normalize (trim + uppercase) resolves however they type it.
export const CMI_SHARED_CODE = "CERTIFIEDNBCMI";
export const CMI_SHARED_CODE_DISPLAY = "CertifiedNBCMI";

export async function ensureCampaignCode(
  code: string,
  percent: number,
  description: string,
  createdByEmail?: string | null,
): Promise<void> {
  const pct = Math.round(percent);
  if (!code || pct <= 0) return;
  await prisma.discountCode.upsert({
    where: { code },
    create: {
      code,
      description,
      kind: "percent",
      inPersonValue: Math.min(100, pct),
      virtualValue: Math.min(100, pct),
      active: true,
      createdByEmail: createdByEmail || null,
    },
    update: {}, // an existing campaign code is left untouched
  });
}

// Standing campaign codes that must always exist: they are printed on
// graphics and social posts, where "code not found" at checkout is a public
// embarrassment. Ensured (idempotently) from the queue routes and the admin
// queue poll, so they exist moments after any deploy is touched.
const STANDING_CAMPAIGN_CODES: { code: string; percent: number; description: string }[] = [
  { code: "CCHIAALB", percent: 25, description: "Meet the Speakers graphic / social campaign (auto-created)" },
];

export async function ensureStandingCampaignCodes(createdByEmail?: string | null): Promise<void> {
  for (const c of STANDING_CAMPAIGN_CODES) {
    await ensureCampaignCode(c.code, c.percent, c.description, createdByEmail).catch(() => {});
  }
}

// Server-side discount logic. The price is ALWAYS computed here from the
// stored code; the client only ever sends the code string, never an amount.
//
// A code carries a separate value per attendance mode (e.g. $15 off virtual,
// $30 off in-person). "kind" says whether those values are cents or percent.
// A null value means the code does not apply to that mode.

export type Mode = "in-person" | "virtual";

export function normalizeCode(raw: string): string {
  return (raw || "").trim().toUpperCase();
}

export type DiscountApplication = {
  code: DiscountCode;
  baseCents: number;
  discountCents: number;
  finalCents: number;
};

export type DiscountError =
  | "not_found"
  | "inactive"
  | "expired"
  | "exhausted"
  | "wrong_mode"
  | "invalid";

// The configured value for a mode (cents-off or percent points), or null if
// the code doesn't apply to that mode.
export function modeValue(code: Pick<DiscountCode, "virtualValue" | "inPersonValue">, mode: Mode): number | null {
  const v = mode === "in-person" ? code.inPersonValue : code.virtualValue;
  return v == null ? null : v;
}

// How much a code takes off a given base price for a mode. Clamped so the
// discount never exceeds the price and a percent stays within 0..100.
export function discountCentsFor(code: DiscountCode, baseCents: number, mode: Mode): number {
  const value = modeValue(code, mode);
  if (value == null) return 0;
  if (code.kind === "fixed") {
    return Math.min(Math.max(0, value), baseCents);
  }
  // percent
  const pct = Math.max(0, Math.min(100, value));
  return Math.round((baseCents * pct) / 100);
}

// Validate a code against a base price and attendance mode, returning either
// the computed application or a typed error. Does not mutate anything.
export async function validateAndApply(
  rawCode: string,
  baseCents: number,
  attendanceMode: string | null | undefined,
  now: Date = new Date()
): Promise<{ ok: true; result: DiscountApplication } | { ok: false; error: DiscountError }> {
  const normalized = normalizeCode(rawCode);
  if (!normalized) return { ok: false, error: "invalid" };
  if (attendanceMode !== "in-person" && attendanceMode !== "virtual") {
    return { ok: false, error: "invalid" };
  }
  if (!Number.isFinite(baseCents) || baseCents <= 0) return { ok: false, error: "invalid" };

  const code = await prisma.discountCode.findUnique({ where: { code: normalized } });
  if (!code) return { ok: false, error: "not_found" };
  if (!code.active) return { ok: false, error: "inactive" };
  if (code.expiresAt && code.expiresAt.getTime() < now.getTime()) {
    return { ok: false, error: "expired" };
  }
  if (code.maxRedemptions != null && code.redeemedCount >= code.maxRedemptions) {
    return { ok: false, error: "exhausted" };
  }
  // The code must have a value configured for this mode.
  if (modeValue(code, attendanceMode) == null) {
    return { ok: false, error: "wrong_mode" };
  }

  const discountCents = discountCentsFor(code, baseCents, attendanceMode);
  const finalCents = Math.max(0, baseCents - discountCents);
  return { ok: true, result: { code, baseCents, discountCents, finalCents } };
}

// A short label for one mode's value, e.g. "$15 off" or "10% off", or null if
// the mode isn't covered.
export function describeMode(
  code: Pick<DiscountCode, "kind" | "virtualValue" | "inPersonValue">,
  mode: Mode
): string | null {
  const value = modeValue(code, mode);
  if (value == null) return null;
  if (code.kind === "fixed") {
    return `$${(value / 100).toLocaleString("en-US", { minimumFractionDigits: value % 100 ? 2 : 0, maximumFractionDigits: 2 })} off`;
  }
  return `${value}% off`;
}

// A combined label across both modes, e.g. "$15 virtual · $30 in-person" or
// "10% off". Used in the dashboard list.
export function describeDiscount(
  code: Pick<DiscountCode, "kind" | "virtualValue" | "inPersonValue">
): string {
  const v = describeMode(code, "virtual");
  const p = describeMode(code, "in-person");
  if (v && p) {
    if (v === p) return v; // same value both modes
    return `${stripOff(v)} virtual · ${stripOff(p)} in-person`;
  }
  if (v) return `${v} (virtual)`;
  if (p) return `${p} (in-person)`;
  return "–";
}

function stripOff(s: string): string {
  return s.replace(/ off$/, "");
}

export const DISCOUNT_ERROR_MESSAGES: Record<DiscountError, string> = {
  not_found: "That code isn't valid. Double-check the spelling.",
  inactive: "That code is no longer active.",
  expired: "That code has expired.",
  exhausted: "That code has reached its usage limit.",
  wrong_mode: "That code doesn't apply to this registration type.",
  invalid: "Enter a valid discount code.",
};
