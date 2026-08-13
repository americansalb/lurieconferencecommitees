// The hour grid an ASL interpreter can accept for the 2026 conference.
//
// Slots are fixed, whole clock hours in Chicago time (CDT, UTC-5 on both
// conference days) chosen to cover the published program with a little
// slack on each end:
//   Saturday, August 15: program runs 8:30 AM to 6:30 PM CT -> 8 AM to 7 PM
//   Sunday,   August 16: program runs 8:00 AM to 4:35 PM CT -> 8 AM to 5 PM
//
// A slot id is the UTC ISO timestamp of the hour start, e.g.
// "2026-08-15T13:00:00.000Z" is Saturday 8:00 AM CT. Storing UTC keeps the
// database unambiguous no matter what timezone the interpreter picked, and
// the client renders each slot in their verified local timezone.
//
// Shared by the public /asl page (rendering) and the accept API
// (validation), so keep this file free of server-only imports.

export const CONFERENCE_TZ = "America/Chicago";

// UTC-5 offset applies on both days (CDT).
const CT_OFFSET_HOURS = 5;

export type AslDay = {
  key: "sat" | "sun";
  /** e.g. "Saturday, August 15" */
  label: string;
  /** ISO date in Chicago, e.g. "2026-08-15" */
  isoDate: string;
  /** First bookable hour, Chicago clock (24h) */
  firstHourCT: number;
  /** Last bookable hour START, Chicago clock (24h). The slot ends an hour later. */
  lastHourCT: number;
};

export const ASL_DAYS: AslDay[] = [
  {
    key: "sat",
    label: "Saturday, August 15",
    isoDate: "2026-08-15",
    firstHourCT: 8,
    lastHourCT: 18, // final slot 6 to 7 PM CT covers the 6:30 PM close
  },
  {
    key: "sun",
    label: "Sunday, August 16",
    isoDate: "2026-08-16",
    firstHourCT: 8,
    lastHourCT: 16, // final slot 4 to 5 PM CT covers the 4:35 PM close
  },
];

export type AslSlot = {
  id: string; // UTC ISO of the hour start
  dayKey: "sat" | "sun";
  /** Hour start, Chicago clock, 24h */
  hourCT: number;
  /** Millisecond epoch of the hour start */
  startMs: number;
};

function slotForHour(day: AslDay, hourCT: number): AslSlot {
  const startMs = Date.UTC(2026, 7, Number(day.isoDate.slice(-2)), hourCT + CT_OFFSET_HOURS, 0, 0, 0);
  return {
    id: new Date(startMs).toISOString(),
    dayKey: day.key,
    hourCT,
    startMs,
  };
}

export function slotsForDay(day: AslDay): AslSlot[] {
  const out: AslSlot[] = [];
  for (let h = day.firstHourCT; h <= day.lastHourCT; h++) out.push(slotForHour(day, h));
  return out;
}

export const ALL_ASL_SLOTS: AslSlot[] = ASL_DAYS.flatMap(slotsForDay);

export const ASL_SLOT_IDS = new Set(ALL_ASL_SLOTS.map((s) => s.id));

/** "8:00 AM" for a slot start in an arbitrary IANA timezone. */
export function slotTimeLabel(slot: AslSlot, timeZone: string, endOfHour = false): string {
  const d = new Date(slot.startMs + (endOfHour ? 60 * 60 * 1000 : 0));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(d);
}

/** "Sat" / "Sun" (or whatever weekday the hour lands on in that timezone). */
export function slotWeekdayLabel(slot: AslSlot, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(new Date(slot.startMs));
}

/** True when the given IANA timezone shows the same wall clock as Chicago. */
export function sameClockAsChicago(timeZone: string): boolean {
  const probe = ALL_ASL_SLOTS[0];
  return (
    slotTimeLabel(probe, timeZone) === slotTimeLabel(probe, CONFERENCE_TZ) &&
    slotWeekdayLabel(probe, timeZone) === slotWeekdayLabel(probe, CONFERENCE_TZ)
  );
}

export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string" || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Chicago-clock label for a slot, used in internal emails and the review step. */
export function slotChicagoLabel(slot: AslSlot): string {
  const day = ASL_DAYS.find((d) => d.key === slot.dayKey);
  return `${day ? day.label : slot.dayKey} · ${slotTimeLabel(slot, CONFERENCE_TZ)} to ${slotTimeLabel(slot, CONFERENCE_TZ, true)} CT`;
}

/**
 * The selected hours of each day merged into human ranges ("9:00 AM to
 * 12:00 PM, 2:00 PM to 5:00 PM"), rendered in the given timezone. Days with
 * nothing selected are omitted.
 */
export function availabilityRanges(
  slotIds: Set<string>,
  timeZone: string
): { day: AslDay; hours: number; text: string }[] {
  const out: { day: AslDay; hours: number; text: string }[] = [];
  for (const day of ASL_DAYS) {
    const daySlots = slotsForDay(day).filter((s) => slotIds.has(s.id));
    if (!daySlots.length) continue;
    const ranges: { from: AslSlot; to: AslSlot }[] = [];
    for (const slot of daySlots) {
      const last = ranges[ranges.length - 1];
      if (last && slot.hourCT === last.to.hourCT + 1) last.to = slot;
      else ranges.push({ from: slot, to: slot });
    }
    out.push({
      day,
      hours: daySlots.length,
      text: ranges
        .map((r) => `${slotTimeLabel(r.from, timeZone)} to ${slotTimeLabel(r.to, timeZone, true)}`)
        .join(", "),
    });
  }
  return out;
}
