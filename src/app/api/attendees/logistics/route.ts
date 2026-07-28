import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Operational view of what registered attendees have actually asked us for:
// accessibility accommodations, dietary needs, parking, and the languages in
// the room. Everything here is free text the attendee typed, so we tally
// recognizable categories for planning AND always return the verbatim note,
// because an accommodation request is a promise to one person and must never
// be summarized away.
//
// "Registered" = paid. Anyone who filled the form but hasn't paid is returned
// separately as `pending` so the room can be planned on confirmed numbers
// without losing sight of a request that's already in.

// Category detection over free text. Ordered most-specific first; a note can
// match several categories (a person can need both CART and a wheelchair).
const ACCESS_TAGS: { key: string; label: string; re: RegExp }[] = [
  { key: "asl", label: "ASL interpretation", re: /\basl\b|american sign|sign language|interpreter for the deaf/i },
  { key: "cart", label: "CART / live captions", re: /\bcart\b|caption|cc\b|subtitl|transcri/i },
  { key: "deafblind", label: "DeafBlind support", re: /deaf\s*-?\s*blind|tactile|protactile|ssp\b/i },
  { key: "wheelchair", label: "Wheelchair / mobility", re: /wheelchair|mobility|scooter|walker|accessible seating|ramp|elevator/i },
  { key: "seating", label: "Seating / front row", re: /front row|near the front|reserved seat|seating near|sit close/i },
  { key: "sensory", label: "Sensory-friendly", re: /sensory|quiet room|low.?stimulation|noise.?cancel|autis|overstimul/i },
  { key: "vision", label: "Large print / vision", re: /large print|braille|low vision|blind\b|screen reader|magnif/i },
  { key: "service-animal", label: "Service animal", re: /service (animal|dog)|guide dog/i },
  { key: "lactation", label: "Lactation / nursing", re: /lactation|nursing (room|mother)|breastfeed|pump/i },
];

const DIET_TAGS: { key: string; label: string; re: RegExp }[] = [
  { key: "vegan", label: "Vegan", re: /\bvegan\b/i },
  { key: "vegetarian", label: "Vegetarian", re: /vegetarian|veggie|no meat|meat.?free/i },
  { key: "gluten", label: "Gluten-free", re: /gluten|celiac|coeliac/i },
  { key: "halal", label: "Halal", re: /halal/i },
  { key: "kosher", label: "Kosher", re: /kosher/i },
  { key: "nut", label: "Nut allergy", re: /\bnut\b|nuts\b|peanut|almond|cashew|tree.?nut/i },
  { key: "dairy", label: "Dairy-free / lactose", re: /dairy|lactose|milk\b|cheese/i },
  { key: "shellfish", label: "Shellfish / seafood", re: /shellfish|shrimp|seafood|crab|lobster|fish\b/i },
  { key: "egg", label: "Egg allergy", re: /\begg/i },
  { key: "soy", label: "Soy", re: /\bsoy\b/i },
  { key: "pork", label: "No pork", re: /no pork|pork.?free|without pork/i },
  { key: "allergy-other", label: "Other allergy", re: /allerg|intoleran|anaphyla/i },
];

function tally(tags: { key: string; label: string; re: RegExp }[], notes: string[]) {
  return tags
    .map((t) => ({ key: t.key, label: t.label, count: notes.filter((n) => t.re.test(n)).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

// Split a free-text language field into individual languages. People write
// "Spanish/English", "ENGLISH , URDU, PUNJABI", "Rohingya and Burmese", so we
// split on punctuation and the word "and", then title-case for grouping.
function splitLanguages(raw: string): string[] {
  return raw
    .split(/[,;/&+|]+|\band\b/i)
    .map((s) => s.trim().replace(/[.]+$/, ""))
    .filter((s) => s.length > 1 && s.length < 40)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.attendee.findMany({
    where: { isTest: false },
    select: {
      id: true, firstName: true, lastName: true, email: true, affiliation: true,
      attendanceMode: true, attendDay: true, needsParking: true,
      accessibilityNotes: true, dietary: true, primaryLanguages: true,
      paid: true, status: true, confirmedAt: true,
    },
    orderBy: [{ paid: "desc" }, { confirmedAt: "desc" }],
  });

  // Someone counts as "registered" once they've paid. Started-but-unpaid
  // people are reported separately rather than folded in, so headcounts used
  // for catering and room setup are confirmed numbers.
  const started = (s: string) => s === "registered" || s === "rsvp_pending" || s === "confirmed";
  const paid = rows.filter((r) => r.paid);
  const pending = rows.filter((r) => !r.paid && started(r.status));

  function summarize(list: typeof rows) {
    const inPerson = list.filter((r) => r.attendanceMode === "in-person");
    const virtual = list.filter((r) => r.attendanceMode === "virtual");
    const oneDay = virtual.filter((r) => r.attendDay === "sat" || r.attendDay === "sun");

    const person = (r: (typeof rows)[number]) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`.trim(),
      email: r.email,
      affiliation: r.affiliation,
      mode: r.attendanceMode,
      attendDay: r.attendDay,
      paid: r.paid,
    });

    // Verbatim requests, never collapsed into a count alone.
    const accessibility = list
      .filter((r) => (r.accessibilityNotes || "").trim())
      .map((r) => ({ ...person(r), note: r.accessibilityNotes!.trim() }));
    const dietary = list
      .filter((r) => (r.dietary || "").trim())
      .map((r) => ({ ...person(r), note: r.dietary!.trim() }));

    // Languages across the room, from the free-text field.
    const langCounts = new Map<string, number>();
    let langAnswered = 0;
    for (const r of list) {
      const raw = (r.primaryLanguages || "").trim();
      if (!raw) continue;
      langAnswered++;
      for (const l of Array.from(new Set(splitLanguages(raw)))) {
        langCounts.set(l, (langCounts.get(l) || 0) + 1);
      }
    }
    const languages = Array.from(langCounts.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));

    return {
      total: list.length,
      inPerson: inPerson.length,
      virtual: virtual.length,
      oneDay: oneDay.length,
      oneDaySat: virtual.filter((r) => r.attendDay === "sat").length,
      oneDaySun: virtual.filter((r) => r.attendDay === "sun").length,
      modeUnset: list.filter((r) => !r.attendanceMode).length,
      parking: {
        // Only in-person attendees are asked about parking.
        asked: inPerson.length,
        yes: inPerson.filter((r) => r.needsParking === true).length,
        no: inPerson.filter((r) => r.needsParking === false).length,
        unsure: inPerson.filter((r) => r.needsParking == null).length,
      },
      accessibility: {
        people: accessibility,
        tags: tally(ACCESS_TAGS, accessibility.map((a) => a.note)),
      },
      dietary: {
        people: dietary,
        tags: tally(DIET_TAGS, dietary.map((d) => d.note)),
        // Catering headcount is in-person only; virtual attendees aren't fed.
        inPersonWithNotes: dietary.filter((d) => d.mode === "in-person").length,
      },
      languages,
      languagesAnswered: langAnswered,
    };
  }

  return NextResponse.json({
    registered: summarize(paid),
    pending: summarize(pending),
  });
}
