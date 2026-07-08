import { randomBytes } from "crypto";
import { appUrl } from "./presenters";

// The ambassador program: educators, program directors, and association
// leaders who share the conference with their students and members. Each
// ambassador gets a personal, trackable discount code:
export const AMBASSADOR_DISCOUNT_PCT = 20;
// Valid through August 10, 2026 (Chicago time), unlimited uses.
export const AMBASSADOR_CODE_EXPIRES = new Date("2026-08-10T23:59:59-05:00");

export function newAmbassadorToken() {
  return randomBytes(24).toString("base64url");
}

// A short, typeable share code from the ambassador's name (or org), e.g.
// "GARCIA20" or "CHICATA20". Uppercase alphanumeric to satisfy the discount
// code format; the caller de-collides against existing codes.
export function suggestAmbassadorCode(contactName: string, orgName: string): string {
  const person = (contactName || "").trim();
  let base = "";
  if (person) {
    const tokens = person.replace(/,.*$/, "").split(/\s+/).filter(Boolean);
    base = tokens[tokens.length - 1] || "";
  }
  if (!base) {
    // Org acronym from the leading words, e.g. "College of DuPage" -> "COD".
    const words = (orgName || "").replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
    base = words.slice(0, 3).map((w) => w[0]).join("");
    if (base.length < 3) base = (orgName || "SHARE").replace(/[^A-Za-z0-9]/g, "").slice(0, 6);
  }
  const clean = base.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "SHARE";
  return `${clean}${AMBASSADOR_DISCOUNT_PCT}`;
}

export function ambassadorUnsubscribeUrl(token: string) {
  return `${appUrl()}/api/ambassadors/unsubscribe/${token}`;
}

// RFC 8058 one-click unsubscribe headers for ambassador mail.
export function ambassadorUnsubHeaders(token: string): Record<string, string> {
  const url = ambassadorUnsubscribeUrl(token);
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// The link ambassadors forward: registration with their code prefilled.
export function ambassadorShareUrl(code: string, base = appUrl()) {
  return `${base.replace(/\/$/, "")}/register?code=${encodeURIComponent(code)}`;
}

// Institution-first, no discount language: the subject should read like
// correspondence between institutions, not marketing. A "20% off" subject was
// the salesiest thing in the old letter. Long program suffixes ("Org — Program
// name") are trimmed to the institution so the subject stays scannable.
export function ambassadorSubject(orgName: string): string {
  const shortOrg = orgName.split("—")[0].trim() || orgName.trim();
  return `The 2026 Lurie Children's & AALB Conference — an invitation for ${shortOrg}`;
}

export const AMBASSADOR_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Loaded", color: "bg-slate-100 text-slate-600 border-slate-200" },
  queued: { label: "Queued", color: "bg-sky-50 text-sky-700 border-sky-200" },
  invited: { label: "Sent", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
