// Canonical form of a recipient's personal discount code: their first name.
// Kept prisma-free so the mail builder, the discount upsert, the checkout
// guard, and the public funnel all derive the exact same string. Matches the
// way the funnel normalizes a typed code (trim + uppercase), so a recipient
// can type their first name on the public site and it resolves to their code.
export function firstNameToCode(firstName: string): string {
  return (firstName || "").trim().replace(/\s+/g, " ").toUpperCase();
}

// What a Chicago guest's first-name code is worth to the people they pass it
// to. Deliberately NOT the same number as the guest's own seat.
//
// The guest comes free: their attendee row carries a 100% personal discount,
// so their own link costs nothing. Their first-name code is a different
// object with a different job, and it is public in practice, because it is
// literally their first name and the funnel resolves any typed first name to
// it. Minting it at the guest's own rate would publish a 100%-off code called
// JAZMIN, and the next person to guess a common first name gets a free
// ticket. So the seat is a gift to one named person and the code is a
// discount for whoever they choose to bring.
export const GUEST_SHARE_PERCENT = 25;
