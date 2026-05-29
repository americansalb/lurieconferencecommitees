// Shared pricing source of truth used by both the Hero info card and the
// full Pricing section, so the hero never drifts out of sync with the
// pricing table.

export const SCHEDULE = [
  { id: "early",    label: "Early Bird", end: "2026-04-15T23:59:59-05:00" },
  { id: "standard", label: "Standard",   end: "2026-06-15T23:59:59-05:00" },
  { id: "late",     label: "Late",       end: "2026-08-15T23:59:59-05:00" },
] as const;

export type TierId = typeof SCHEDULE[number]["id"];

export const PRICES: Record<TierId, { virtual: number; inPerson: number }> = {
  early:    { virtual:  95, inPerson: 195 },
  standard: { virtual: 105, inPerson: 210 },
  late:     { virtual: 115, inPerson: 225 },
};

export function activeTier(now: Date) {
  for (const t of SCHEDULE) {
    if (now.getTime() <= new Date(t.end).getTime()) return t;
  }
  return SCHEDULE[SCHEDULE.length - 1];
}
