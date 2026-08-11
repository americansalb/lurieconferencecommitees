/*
 * Render every email template with a missing name and fail on mail-merge tells.
 *
 * Written after "Your exhibitor guide is attached, there." went out to real
 * exhibitors. The bug was not hard to see; it was that every preview I had
 * looked at used a contact who happened to have a name. This renders the
 * blank case for all of them at once.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/check-email-greetings.ts
 */
import * as T from "../src/lib/mail-templates";

// Every argument name the templates read, all blank. Anything that needs a
// value to render at all still gets a URL-shaped string.
const BLANK: Record<string, unknown> = {
  name: "", firstName: "", lastName: "", contactName: "", contactFirstName: "",
  inviteeName: "", hostName: "", recipientFirstName: "", greeting: "",
  companyName: "Acme Health", orgName: "Acme Health", affiliation: "",
  url: "https://x/y", portalUrl: "https://x/y", teamUrl: "https://x/y",
  shareUrl: "https://x/y", landingUrl: "https://x/y", learnMoreUrl: "https://x/y",
  pledgeUrl: "https://x/y", payUrl: "https://x/y", materialsUrl: "https://x/y",
  ctaUrl: "https://x/y", submitUrl: "https://x/y", joinUrl: "https://x/y",
  signupUrl: "https://x/y", screenReaderUrl: "https://x/y",
  unsubscribeUrl: "https://x/y", assetBase: "https://x", siteUrl: "https://x",
  durationMin: 30, durationMinutes: 30, minutes: 30, bookUrl: "https://x/y", when: "Monday at 10:00 AM", inviteeEmail: "a@b.c",
  code: "CODE20", dateLabel: "August 1, 2026", tierName: "Exhibitor Table",
  amountLabel: "$650", pledge: "", provide: "", arrangementLabel: "",
  bodyHtml: "<p>x</p>", attendanceMode: "in-person", seatsRemaining: 0,
  reminderNumber: 1, ticketsIncluded: 1, finalPriceCents: 0, discountPercent: null,
  kind: "asl", variant: "general", talkTitle: "", role: "", sessionFormat: "",
  region: "chicago", hasDetails: false, hasLogo: false, isPartner: false,
  suggestedTier: null, inviteMessage: "", reason: "", note: "", team: [],
  sponsor: { companyName: "Acme Health", contactName: "", contactEmail: "a@b.c", tier: "exhibitor", amountCents: 0 },
};

// "Hi there," is ordinary English. These are not.
const TELLS = [
  /,\s*there\s*[.!?]/i,
  /\bDear\s+there\b/i,
  /\bthere\b['’]s guide/i,
  /,\s*undefined\b/i,
  /\bundefined\b/,
  /\bnull\b/,
  // ", ." with no letter between, but not the ".SVG, .EPS" style lists that
  // legitimately put a comma before a dot.
  /,\s*\.(?![A-Za-z])/,
  // An empty salutation is the other half of the same bug: swapping "there"
  // for nothing is only a fix if the comma goes with it.
  // A space between the greeting word and the comma means a name was meant to
  // be there. "Hello," and "Hi there," are the intended nameless forms.
  /\b(Dear|Hi|Hello)\s+,/i,
  // "a Exhibitor Table", "a ASL Interpreter Sponsor": the article has to agree
  // with an interpolated label, and it never does by luck.
  /\ba (?=[AEIOU][a-z])/,
];
// NB: a stray " ," in the stripped text is almost always a link immediately
// followed by a comma, not a real defect, so it is deliberately not a tell.

let checked = 0, skipped = 0;
const bad: { fn: string; hit: string; line: string }[] = [];

for (const [fn, val] of Object.entries(T)) {
  if (typeof val !== "function") continue;
  let html: string;
  try {
    html = (val as (a: unknown) => string)(BLANK);
    if (typeof html !== "string" || !html.includes("<")) { skipped++; continue; }
  } catch {
    skipped++;
    continue;
  }
  checked++;
  const text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const re of TELLS) {
    const m = text.match(re);
    if (m) {
      const i = Math.max(0, text.indexOf(m[0]) - 60);
      bad.push({ fn, hit: m[0], line: text.slice(i, i + 150).trim() });
      break;
    }
  }
}

console.log(`checked ${checked} templates, ${skipped} needed arguments this harness does not supply`);
if (!bad.length) {
  console.log("no mail-merge tells with a blank name");
  process.exit(0);
}
for (const b of bad) console.log(`\n  ${b.fn}\n    hit: ${JSON.stringify(b.hit)}\n    ...${b.line}...`);
process.exit(1);
