import { randomBytes } from "crypto";

// Timezone-aware slot math, dependency-free (native Intl). All persistence is
// in absolute UTC; member weekly rules are wall-clock minutes in the member's
// own timezone, so we convert per-day using the zone's offset for that date.

export function newBookingToken(): string {
  return randomBytes(24).toString("base64url");
}

// The UTC offset (in minutes, e.g. -300 for CDT) that a given timezone is at
// on a specific instant. Derived from Intl parts vs. the UTC clock — handles
// DST because it's evaluated at the actual instant.
export function tzOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(at).reduce<Record<string, number>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = parseInt(p.value, 10);
    return acc;
  }, {});
  // Wall-clock time in the zone, interpreted as if it were UTC.
  const asUTC = Date.UTC(
    parts.year, parts.month - 1, parts.day,
    parts.hour === 24 ? 0 : parts.hour, parts.minute, parts.second
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

// The absolute instant for a given wall-clock time (Y/M/D + minutes from
// midnight) in a timezone. Two-pass to settle DST near the boundary.
export function zonedTimeToUtc(
  timeZone: string,
  year: number,
  month: number, // 1-12
  day: number,
  minutesFromMidnight: number
): Date {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  const naiveUTC = Date.UTC(year, month - 1, day, hours, mins, 0);
  // First guess using the offset at the naive instant, then refine once.
  let guess = new Date(naiveUTC - tzOffsetMinutes(timeZone, new Date(naiveUTC)) * 60000);
  const off2 = tzOffsetMinutes(timeZone, guess);
  guess = new Date(naiveUTC - off2 * 60000);
  return guess;
}

// The local Y/M/D and weekday for an instant in a timezone.
export function zonedParts(timeZone: string, at: Date): { year: number; month: number; day: number; weekday: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  });
  const parts = dtf.formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

export type WeeklyRule = { userId: string; weekday: number; startMin: number; endMin: number };
export type Exception = { userId: string; kind: "add" | "block"; startAt: Date; endAt: Date };
export type Busy = { userId: string; startAt: Date; endAt: Date };

export type Slot = { startAt: Date; endAt: Date; userIds: string[] };

type Interval = { start: number; end: number; userId: string };

// Build the pooled list of bookable slots between `from` and `to`, stepping by
// `durationMin`. A slot is offered if at least one member is free for its whole
// length (pooled first-available). Returned slots carry the ids of every member
// free for that slot, so the booker can pick whoever to assign.
export function computeSlots(opts: {
  memberIds: string[];
  timeZonesByUser: Record<string, string>; // each member's own tz for their rules
  rules: WeeklyRule[];
  exceptions: Exception[];
  busy: Busy[];          // existing bookings (and external busy) to subtract
  durationMin: number;
  from: Date;
  to: Date;
  granularityMin?: number; // slot step; defaults to durationMin
  minLeadMin?: number;     // earliest offset from now; default 120 (2h)
  now?: Date;
}): Slot[] {
  const {
    memberIds, timeZonesByUser, rules, exceptions, busy,
    durationMin, from, to,
  } = opts;
  const granularity = opts.granularityMin ?? durationMin;
  const now = opts.now ?? new Date();
  const earliest = new Date(now.getTime() + (opts.minLeadMin ?? 120) * 60000);

  // Per member, materialize "available" intervals (UTC ms) across the window
  // from their weekly rules, then add "add" exceptions and subtract "block"
  // exceptions and busy times.
  const availByUser: Record<string, Interval[]> = {};
  for (const userId of memberIds) availByUser[userId] = [];

  // Expand weekly rules day by day in each member's tz.
  for (const userId of memberIds) {
    const tz = timeZonesByUser[userId] || "America/Chicago";
    const userRules = rules.filter((r) => r.userId === userId);
    if (userRules.length === 0) continue;
    // Walk each calendar day in the window (use UTC day stepping with a pad).
    const dayCursor = new Date(from.getTime() - 24 * 3600 * 1000);
    const end = new Date(to.getTime() + 24 * 3600 * 1000);
    while (dayCursor <= end) {
      const lp = zonedParts(tz, dayCursor);
      for (const r of userRules) {
        if (r.weekday !== lp.weekday) continue;
        const s = zonedTimeToUtc(tz, lp.year, lp.month, lp.day, r.startMin);
        const e = zonedTimeToUtc(tz, lp.year, lp.month, lp.day, r.endMin);
        availByUser[userId].push({ start: s.getTime(), end: e.getTime(), userId });
      }
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }
  }

  // Add "add" exceptions.
  for (const ex of exceptions) {
    if (ex.kind === "add" && availByUser[ex.userId]) {
      availByUser[ex.userId].push({ start: ex.startAt.getTime(), end: ex.endAt.getTime(), userId: ex.userId });
    }
  }

  // Subtract blocks + busy from each member's intervals.
  const blocksByUser: Record<string, { start: number; end: number }[]> = {};
  for (const userId of memberIds) blocksByUser[userId] = [];
  for (const ex of exceptions) {
    if (ex.kind === "block" && blocksByUser[ex.userId]) {
      blocksByUser[ex.userId].push({ start: ex.startAt.getTime(), end: ex.endAt.getTime() });
    }
  }
  for (const b of busy) {
    if (blocksByUser[b.userId]) blocksByUser[b.userId].push({ start: b.startAt.getTime(), end: b.endAt.getTime() });
  }

  const freeByUser: Record<string, Interval[]> = {};
  for (const userId of memberIds) {
    freeByUser[userId] = subtract(availByUser[userId], blocksByUser[userId], userId);
  }

  // A slot is valid if it fits wholly within at least one member's free
  // interval. Candidate starts are anchored to the absolute granularity grid
  // (epoch-aligned), so they land on clean clock times (9:00, 9:30, …) and are
  // identical across requests. Previously the grid was anchored to `from`/now,
  // which made every slot inherit the request's sub-minute offset — so a start
  // time returned by the slots endpoint never matched when posted back to
  // confirm, and bookings always failed with "that time is no longer available".
  const stepMs = granularity * 60000;
  const durMs = durationMin * 60000;
  const lowerBound = Math.max(from.getTime(), earliest.getTime());

  const candidates = new Set<number>();
  for (const userId of memberIds) {
    for (const iv of freeByUser[userId]) {
      const first = Math.ceil(iv.start / stepMs) * stepMs;
      for (let t = first; t + durMs <= iv.end; t += stepMs) {
        if (t >= lowerBound && t + durMs <= to.getTime()) candidates.add(t);
      }
    }
  }

  const slots: Slot[] = [];
  for (const slotStart of Array.from(candidates).sort((a, b) => a - b)) {
    const slotEnd = slotStart + durMs;
    const freeUsers = memberIds.filter((userId) =>
      freeByUser[userId].some((iv) => iv.start <= slotStart && iv.end >= slotEnd)
    );
    if (freeUsers.length > 0) {
      slots.push({ startAt: new Date(slotStart), endAt: new Date(slotEnd), userIds: freeUsers });
    }
  }
  return slots;
}

// Subtract a set of blocks from a set of intervals (all for one user). Returns
// merged, block-free intervals.
function subtract(intervals: Interval[], blocks: { start: number; end: number }[], userId: string): Interval[] {
  const merged = mergeIntervals(intervals);
  let result: { start: number; end: number }[] = merged.map((m) => ({ start: m.start, end: m.end }));
  for (const b of blocks) {
    const next: { start: number; end: number }[] = [];
    for (const iv of result) {
      if (b.end <= iv.start || b.start >= iv.end) { next.push(iv); continue; }
      if (b.start > iv.start) next.push({ start: iv.start, end: Math.min(b.start, iv.end) });
      if (b.end < iv.end) next.push({ start: Math.max(b.end, iv.start), end: iv.end });
    }
    result = next;
  }
  return result.filter((iv) => iv.end > iv.start).map((iv) => ({ ...iv, userId }));
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const out: Interval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    if (sorted[i].start <= last.end) last.end = Math.max(last.end, sorted[i].end);
    else out.push({ ...sorted[i] });
  }
  return out;
}

// Group slots by local calendar day in a timezone, for the booking UI.
export function groupSlotsByDay(slots: Slot[], timeZone: string): { dayKey: string; label: string; slots: Slot[] }[] {
  const groups = new Map<string, Slot[]>();
  for (const s of slots) {
    const p = zonedParts(timeZone, s.startAt);
    const key = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([dayKey, slots]) => {
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone, weekday: "long", month: "long", day: "numeric",
    }).format(slots[0].startAt);
    return { dayKey, label, slots };
  });
}

export function formatSlotTime(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(at);
}
