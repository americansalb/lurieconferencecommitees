// Small, shared helpers for the "delivered vs clicked" engagement views on the
// sponsor and attendee dashboards. Pure functions, safe on the client.

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
