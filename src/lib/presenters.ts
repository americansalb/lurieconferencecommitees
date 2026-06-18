import { randomBytes } from "crypto";

export function newPresenterToken() {
  return randomBytes(32).toString("hex");
}

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") {
    return (process.env.NEXTAUTH_URL || "http://localhost:3002").replace(/\/$/, "");
  }
  return "https://conference.aalb.org";
}

export function confirmationUrl(token: string) {
  return `${appUrl()}/presenters/confirm/${token}`;
}

export const ROLE_OPTIONS = [
  "Presenter",
  "Keynote",
  "Plenary speaker",
  "Panelist",
  "Debater",
  "Moderator",
  "Workshop leader",
  "Lightning talk speaker",
  "Poster presenter",
  "Roundtable host",
];

export const SESSION_LENGTHS = [
  "15 minutes",
  "20 minutes",
  "30 minutes",
  "45 minutes",
  "60 minutes",
  "75 minutes",
  "90 minutes",
  "Half day",
  "Full day",
];

export const QA_LENGTHS = [
  "No Q and A",
  "5 minutes",
  "10 minutes",
  "15 minutes",
  "20 minutes",
  "30 minutes",
];

export const PREFERRED_DAY = [
  "Day 1, August 15",
  "Day 2, August 16",
  "Either day",
  "Both days",
];

export const TRAVEL_MODES = [
  "Flying",
  "Driving",
  "Train",
  "Local, already in Chicago",
  "Virtual",
];

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  proposed: { label: "Applied", color: "bg-violet-50 text-violet-700 border-violet-200" },
  invited: { label: "Invited", color: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  tentative: { label: "Tentative", color: "bg-sky-50 text-sky-700 border-sky-200" },
  changes_requested: { label: "Changes requested", color: "bg-amber-50 text-amber-800 border-amber-200" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

// Ordered for status pickers (earliest stage first). The detail-page status
// override iterates this so an admin can move a presenter to any stage —
// including reverting an accidental "Confirmed" back to "Invited".
export const STATUS_ORDER = ["proposed", "invited", "confirmed", "tentative", "changes_requested", "declined"] as const;

export const BRAND = {
  teal: "#0E5566",
  tealDark: "#0A3F4D",
  blue: "#0066B3",
  blueDark: "#004F8C",
};

export function formatMoney(cents: number | null | undefined) {
  if (cents == null) return null;
  return `$${cents.toLocaleString("en-US")}`;
}
