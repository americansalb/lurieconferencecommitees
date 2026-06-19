// Conference program helpers for the single-track schedule builder.
//
// The conference runs in Chicago, which is on CDT (UTC-5) for Aug 15-16, so we
// build instants with a fixed -05:00 offset and always render in America/Chicago.

export const CHICAGO_TZ = "America/Chicago";
const AUG_OFFSET = "-05:00"; // CDT — valid for the Aug 15-16 conference dates

export const CONFERENCE_DAYS = [
  { id: "2026-08-15", label: "Saturday, August 15", short: "Aug 15", start: "09:30", end: "18:00" },
  { id: "2026-08-16", label: "Sunday, August 16", short: "Aug 16", start: "09:30", end: "16:00" },
] as const;

export type ConferenceDayId = (typeof CONFERENCE_DAYS)[number]["id"];

export const SESSION_KINDS = [
  { id: "session", label: "Session", accent: "#0E5566", soft: "#E6EEF0" },
  { id: "keynote", label: "Keynote", accent: "#B6862C", soft: "#F4E9CD" },
  { id: "panel", label: "Panel", accent: "#2A8FCC", soft: "#E6F2FB" },
  { id: "workshop", label: "Workshop", accent: "#7C3AED", soft: "#EDE9FE" },
  { id: "break", label: "Break", accent: "#64748B", soft: "#F1F5F9" },
  { id: "lunch", label: "Lunch", accent: "#D97706", soft: "#FEF3C7" },
  { id: "registration", label: "Registration", accent: "#0D9488", soft: "#CCFBF1" },
  { id: "networking", label: "Networking", accent: "#DB2777", soft: "#FCE7F3" },
] as const;

export function kindMeta(id: string) {
  return SESSION_KINDS.find((k) => k.id === id) || SESSION_KINDS[0];
}

export const DURATION_PRESETS = [15, 30, 45, 60, 75, 90];

// Build a UTC instant (ISO string) from a conference day id + "HH:MM" local time.
export function chicagoInstant(dayId: string, hhmm: string): string {
  return `${dayId}T${hhmm}:00${AUG_OFFSET}`;
}

export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

export function durationMinutes(startIso: string | Date, endIso: string | Date): number {
  const s = typeof startIso === "string" ? new Date(startIso) : startIso;
  const e = typeof endIso === "string" ? new Date(endIso) : endIso;
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
}

// Which conference day an instant falls on, by Chicago date (YYYY-MM-DD).
export function dayIdOf(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-CA", { timeZone: CHICAGO_TZ });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", { timeZone: CHICAGO_TZ, hour: "numeric", minute: "2-digit" });
}

// "HH:MM" (24h, Chicago) for <input type="time">.
export function toTimeInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-GB", { timeZone: CHICAGO_TZ, hour12: false, hour: "2-digit", minute: "2-digit" });
}

// Minutes since midnight (Chicago) for positioning blocks on a time grid.
export function minutesOfDay(date: Date | string): number {
  const [h, m] = toTimeInput(date).split(":").map(Number);
  return h * 60 + m;
}

export function hourLabel(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12} ${ampm}`;
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Pull a minute count out of a free-form length like "45 Minutes" or "1 hour".
export function parseLengthToMinutes(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const hr = raw.match(/(\d+(?:\.\d+)?)\s*(hour|hr)/i);
  if (hr) return Math.round(parseFloat(hr[1]) * 60);
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
