// The Zoom rooms for the two conference days, used by the virtual attendee
// info email and the attendee portal's "Joining live" section. One room per
// day; an attendee with a one-day virtual ticket (Attendee.attendDay "sat"
// or "sun") gets only their day.
//
// Times are US Central (Chicago), matching the published program. The
// sign-in-by time is 15 minutes before the first program event of the day
// (Saturday's 9:30 AM opening address, Sunday's 9:00 AM first session),
// which is the early sign-in the CEU register requires; the room itself
// opens with coffee and sign-in.

export type ZoomDay = {
  key: "sat" | "sun";
  dayNumber: 1 | 2;
  label: string;
  shortLabel: string;
  opensCT: string;
  signInByCT: string;
  /** Epoch ms of the room opening / sign-in deadline (CT is UTC-5 in August). */
  opensMs: number;
  signInByMs: number;
  url: string;
  meetingId: string;
};

export const ZOOM_DAYS: ZoomDay[] = [
  {
    key: "sat",
    dayNumber: 1,
    label: "Saturday, August 15",
    shortLabel: "Saturday",
    opensCT: "9:00 AM",
    signInByCT: "9:15 AM",
    opensMs: Date.UTC(2026, 7, 15, 14, 0), // 9:00 AM CDT
    signInByMs: Date.UTC(2026, 7, 15, 14, 15), // 9:15 AM CDT
    url: "https://us06web.zoom.us/j/86848750141",
    meetingId: "868 4875 0141",
  },
  {
    key: "sun",
    dayNumber: 2,
    label: "Sunday, August 16",
    shortLabel: "Sunday",
    opensCT: "8:30 AM",
    signInByCT: "8:45 AM",
    opensMs: Date.UTC(2026, 7, 16, 13, 30), // 8:30 AM CDT
    signInByMs: Date.UTC(2026, 7, 16, 13, 45), // 8:45 AM CDT
    url: "https://us06web.zoom.us/j/83817243936",
    meetingId: "838 1724 3936",
  },
];

/** "10:00 AM" for an epoch ms in an arbitrary IANA timezone. */
export function timeInZone(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(ms));
}

/**
 * The room-open time translated for the coasts, e.g. "10:00 AM Eastern
 * Time · 7:00 AM Pacific Time". Full zone names only, no abbreviations.
 * Mountain Time is deliberately absent: Arizona skips daylight saving, so
 * one "Mountain" figure would be wrong for part of the zone in August. The
 * email cannot know a recipient's timezone, so it shows Central plus these;
 * the portal page can know (it runs in their browser) and converts there.
 */
export function usZoneLine(ms: number): string {
  return [
    { label: "Eastern Time", tz: "America/New_York" },
    { label: "Pacific Time", tz: "America/Los_Angeles" },
  ]
    .map((z) => `${timeInZone(ms, z.tz)} ${z.label}`)
    .join(" · ");
}

/** The rooms this attendee's ticket covers. Null/unknown attendDay = both days. */
export function zoomDaysFor(attendDay: string | null | undefined): ZoomDay[] {
  if (attendDay === "sat" || attendDay === "sun") {
    return ZOOM_DAYS.filter((d) => d.key === attendDay);
  }
  return ZOOM_DAYS;
}
