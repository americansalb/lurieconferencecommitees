// Small, shared helpers for the "delivered vs clicked" engagement views on the
// sponsor and attendee dashboards. Pure functions, safe on the client.

// A click only counts toward engagement if it lands at least this long after
// the send. Anything faster is almost always us opening the email to verify it
// right after it goes out, not the recipient actually engaging.
export const MIN_COUNTED_CLICK_MS = 45_000;

function toMs(x: string | Date | null | undefined): number | null {
  if (!x) return null;
  const t = new Date(x).getTime();
  return Number.isFinite(t) ? t : null;
}

// Does this click count? True when there's a click and either we can't measure
// the gap (no delivery time) or the gap is at least MIN_COUNTED_CLICK_MS.
export function isCountedClick(delivered: string | Date | null | undefined, clicked: string | Date | null | undefined): boolean {
  const c = toMs(clicked);
  if (c == null) return false;
  const d = toMs(delivered);
  if (d == null) return true;
  const gap = c - d;
  return !(gap >= 0 && gap < MIN_COUNTED_CLICK_MS);
}

// The click timestamp if it counts, otherwise null. Preserves the input type so
// callers get back the same string/Date they passed in.
export function countedClickAt<T extends string | Date | null | undefined>(delivered: string | Date | null | undefined, clicked: T): T | null {
  return isCountedClick(delivered, clicked) ? clicked : null;
}

// Short, human "2h", "3d", "<1m" gap between two ISO timestamps.
export function fmtElapsed(fromIso: string | null, toIso: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

// Median of a set of millisecond durations, rendered as "12m" / "3.4h" / "2.1d".
export function medianLabel(values: number[]): string {
  if (!values.length) return "—";
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const ms = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = mins / 60;
  if (hrs < 24) return `${hrs.toFixed(hrs < 10 ? 1 : 0)}h`;
  return `${(hrs / 24).toFixed(1)}d`;
}
