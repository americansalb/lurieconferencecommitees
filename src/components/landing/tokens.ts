// Shared design tokens for the public conference landing pages.
// Kept in one place so the landing, register funnel, and proposal form
// all share the same palette and feel.
//
// Brand direction:
//   - Dark teal anchors AALB
//   - Light blue carries Lurie Children's
//   - White dominates the body, neutrals stay cool and crisp
//   - Gold appears only as a small highlight (the "&" mark in the wordmark,
//     thin underlines under section eyebrows, subtle borders on pills)

export const TOKENS = {
  // AALB dark teal — warm, always reads as teal, never as black.
  // tealDark is the working dark surface; tealDeep is reserved for the
  // footer floor and is intentionally lifted so it stays warmly teal.
  teal: "#0E5566",
  tealDark: "#0E4456",
  tealDeep: "#0C3B4B",
  tealSoft: "#E6EEF0",

  // Lurie Children's light blue
  blue: "#2A8FCC",
  blueDeep: "#1E6FA2",
  blueSoft: "#E6F2FB",

  // Neutrals
  white: "#FFFFFF",
  paper: "#FAFBFC",
  hairline: "#E6EBEE",

  // Gold accents (used sparingly)
  gold: "#C9A14B",
  goldSoft: "#F4E9CD",

  // Text
  ink: "#0B1F25",
  inkSoft: "#284752",
  muted: "#5A6E76",
  mutedSoft: "#8898A0",
};

export const CONFERENCE = {
  name: "2026 Lurie Children's and AALB Conference",
  shortName: "Conference 2026",
  theme: "True Language Access: Yesterday, Today, and Tomorrow",
  startDate: "2026-08-15",
  endDate: "2026-08-16",
  prettyDates: "August 15 and 16, 2026",
  city: "Chicago, Illinois",
  venueName: "Ann & Robert H. Lurie Children's Hospital of Chicago",
  venueShort: "Lurie Children's",
  venueAddress: "225 E Chicago Ave, Chicago, IL 60611",
  contactEmail: "contact@aalb.org",
  eins: "83-3016421 and 36-2170833",
};
