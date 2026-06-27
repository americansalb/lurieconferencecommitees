// Shared pricing source of truth used by both the Hero info card and the
// full Pricing section, so the hero never drifts out of sync with the
// pricing table.

// The Early Bird window (ended April 15, 2026) is intentionally omitted: it has
// closed, applies to no one, and showing it only makes current registrants feel
// they missed a deal. The story now is simply locking the Standard rate before
// it steps up to Late.
export const SCHEDULE = [
  { id: "standard", label: "Standard",   end: "2026-07-15T23:59:59-05:00" },
  { id: "late",     label: "Late",       end: "2026-08-15T23:59:59-05:00" },
] as const;

export type TierId = typeof SCHEDULE[number]["id"];

export const PRICES: Record<TierId, { virtual: number; inPerson: number }> = {
  standard: { virtual: 105, inPerson: 210 },
  late:     { virtual: 115, inPerson: 225 },
};

export function activeTier(now: Date) {
  for (const t of SCHEDULE) {
    if (now.getTime() <= new Date(t.end).getTime()) return t;
  }
  return SCHEDULE[SCHEDULE.length - 1];
}

// Active price in cents for a given attendance mode, based on today's tier.
// Single source used by the public register endpoint and the Hero card.
export function activePriceCents(mode: "virtual" | "in-person", now = new Date()): number {
  const tier = activeTier(now);
  const price = PRICES[tier.id];
  return mode === "in-person" ? price.inPerson * 100 : price.virtual * 100;
}
