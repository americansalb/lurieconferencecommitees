// The live ASL interpretation request for the 2026 conference.
//
// This is not the general "underwrite accessibility" pitch that the ASL
// Interpreter Sponsor tier normally carries. A registered attendee asked us
// for ASL interpretation, and we are trying to staff it with donated hours
// before we pay for it out of the conference budget. Everything the urgent
// letter says about the ask lives here so the letter, the subject line and
// the internal notes cannot drift apart.

// While this is true, every ASL-tier invitation goes out as the urgent letter
// about the real request rather than the general accessibility pitch. Set it
// to false once interpretation is staffed (or paid for) and the ASL tier goes
// back to being an ordinary sponsorship offer.
export const ASL_REQUEST_OPEN = true;

// The date we have to stop hoping and start paying. Chosen so there is still
// time to book a paid team afterwards, and so the person who asked gets a
// straight answer rather than silence.
export const ASL_DECISION_ISO = "2026-08-06";

export const ASL_DECISION_LABEL = "Thursday, August 6";

// Either kind of coverage helps: an interpreter in the room, or one on camera
// for the livestream. We deliberately do not make the donor choose our
// preference for us, because either one answers the request we received.
export const ASL_COVERAGE_LABEL =
  "in the room in Chicago, or on camera for the livestream, whichever your team can staff";

// Professional practice, and stated in the letter so no agency thinks we are
// asking one person to sign a six-hour day alone.
export const ASL_TEAM_NOTE =
  "We know all-day work is a two-interpreter job with regular switches, and we are not asking anyone to cover a full day alone.";

// Honest units of donation, smallest first, so a partial gift is the easy yes.
export const ASL_UNITS = [
  "a single session",
  "a half day",
  "one of the two days",
  "the full conference",
];

// Roughly what a donor is being asked to cover, in plain terms. No dollar
// figure: the IRS does not allow a deduction for the value of donated
// services, and a charity should describe an in-kind gift rather than value
// it, so quoting a price in the letter would be both useless and misleading.
export const ASL_SCOPE_NOTE =
  "Two days of sessions, August 15 and 16, with about seventy to eighty people in the room and a virtual audience watching along.";
