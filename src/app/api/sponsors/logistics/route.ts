import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// The fields the in-kind logistics form collects, per kind. Anything outside
// this whitelist is ignored, so the portal can't write arbitrary keys.
const SHARED_KEYS = ["attend", "attendeeName", "attendeeEmail", "attendee2Name", "attendee2Email"];
const FOOD_KEYS = ["provide", "day", "meal", "fulfillment", "window", "dayOfContact", "allergens", "setup"];
const ASL_KEYS = ["coverage", "interpreters", "mode", "equipment", "dayOfContact", "materials"];
// Welcome Kit (invite-only remote) sponsors: brochure logistics + the contact
// we announce before the virtual networking session on the Spotlight tier.
const WELCOME_KEYS = ["brochure", "brochureNotes", "spotlightContact", "spotlightNotes"];
const ALLOWED = new Set([...SHARED_KEYS, ...FOOD_KEYS, ...ASL_KEYS, ...WELCOME_KEYS]);

// Public (token-gated) logistics save. Lets an in-kind Food or ASL sponsor fill
// in the coordination details (what they're providing, day, delivery, day-of
// contact, allergens, setup, and so on) straight from their portal, so those
// answers live on the record instead of in an email thread. Mirrors the
// logo-upload and website routes.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, logistics } = body || {};
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (logistics == null || typeof logistics !== "object" || Array.isArray(logistics)) {
    return NextResponse.json({ error: "No details provided." }, { status: 400 });
  }

  // Whitelist keys, coerce to trimmed strings, cap length, drop blanks.
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(logistics as Record<string, unknown>)) {
    if (!ALLOWED.has(k)) continue;
    const s = typeof v === "string" ? v.trim() : "";
    if (s) clean[k] = s.slice(0, 800);
  }

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  // Always store the (possibly empty) map: an empty object reads back as "no
  // details yet" on both the portal and the dashboard, so we avoid needing the
  // Prisma.JsonNull sentinel here.
  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { logistics: clean },
  });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: sponsor.id, type: "logistics_saved" } })
    .catch(() => {});
  return NextResponse.json({ ok: true, logistics: clean });
}
