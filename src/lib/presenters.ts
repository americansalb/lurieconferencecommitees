import { randomBytes } from "crypto";

export function newPresenterToken() {
  return randomBytes(32).toString("hex");
}

export function appUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "https://conference.aalb.org"
  ).replace(/\/$/, "");
}

export function confirmationUrl(token: string) {
  return `${appUrl()}/presenters/confirm/${token}`;
}

export const SESSION_FORMATS = [
  "Keynote",
  "Plenary",
  "Panel",
  "Workshop / Breakout",
  "Lightning Talk",
  "Poster",
  "Roundtable",
  "Other",
];

export const SESSION_LENGTHS = [
  "15 minutes",
  "30 minutes",
  "45 minutes",
  "60 minutes",
  "90 minutes",
  "Half day",
  "Full day",
];

export const TRAVEL_MODES = [
  "Flying",
  "Driving",
  "Train",
  "Local — already in Chicago area",
  "Virtual / remote",
];

export const PREFERRED_DAY = ["Day 1", "Day 2", "Either day", "Both days"];

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited: { label: "Invited", color: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  declined: { label: "Declined", color: "bg-rose-50 text-rose-700 border-rose-200" },
};
