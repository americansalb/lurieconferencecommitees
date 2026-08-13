import "server-only";

// The interpreter budget cap. Deliberately server-only: the public page asks
// for a rate and, when it exceeds this, shows a generic "outside our budget"
// error without ever revealing the ceiling. Keep this constant out of any
// client component import chain so the number cannot be read from the
// JavaScript bundle. Validation happens in the API routes only.
//
// Override per-deploy with ASL_MAX_HOURLY_CENTS if the budget changes.

const DEFAULT_MAX_HOURLY_CENTS = 7500; // $75.00 per hour

export function aslMaxHourlyCents(): number {
  const raw = Number(process.env.ASL_MAX_HOURLY_CENTS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MAX_HOURLY_CENTS;
}

/** The exact message the form shows. Never includes the amount. */
export const ASL_FEE_ERROR = "That rate is outside our budget for this event.";

export function feeWithinBudget(hourlyCents: number): boolean {
  return Number.isFinite(hourlyCents) && hourlyCents > 0 && hourlyCents <= aslMaxHourlyCents();
}
