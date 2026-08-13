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
    url: "https://us06web.zoom.us/j/83817243936",
    meetingId: "838 1724 3936",
  },
];

/** The rooms this attendee's ticket covers. Null/unknown attendDay = both days. */
export function zoomDaysFor(attendDay: string | null | undefined): ZoomDay[] {
  if (attendDay === "sat" || attendDay === "sun") {
    return ZOOM_DAYS.filter((d) => d.key === attendDay);
  }
  return ZOOM_DAYS;
}
