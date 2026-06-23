// Canonical form of a recipient's personal discount code: their first name.
// Kept prisma-free so the mail builder, the discount upsert, the checkout
// guard, and the public funnel all derive the exact same string. Matches the
// way the funnel normalizes a typed code (trim + uppercase), so a recipient
// can type their first name on the public site and it resolves to their code.
export function firstNameToCode(firstName: string): string {
  return (firstName || "").trim().replace(/\s+/g, " ").toUpperCase();
}
