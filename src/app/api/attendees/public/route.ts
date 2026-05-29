import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newAttendeeToken } from "@/lib/attendees";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/presenters";
import { activePriceCents, activeTier } from "@/components/landing/pricing-data";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// Public registration. Creates an Attendee with no inviting team member,
// computes the price from today's active pricing tier, and returns a
// Stripe Checkout URL the client can redirect to.
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Registration is temporarily offline. Please email contact@aalb.org." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const {
    firstName, lastName, email, phone,
    primaryLanguages, attendanceMode,
    needsParking, accessibilityNotes, dietary,
  } = body;

  // Validation
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (attendanceMode !== "in-person" && attendanceMode !== "virtual") {
    return NextResponse.json({ error: "Please choose in-person or virtual attendance." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // If the email is already registered and paid, block. If unpaid, let them
  // resume; we update the existing record and start a fresh Stripe session.
  const existing = await prisma.attendee.findUnique({ where: { email: normalizedEmail } });
  if (existing?.paid) {
    return NextResponse.json(
      { error: `${normalizedEmail} is already registered. Check your inbox for your confirmation.` },
      { status: 409 }
    );
  }

  const priceCents = activePriceCents(attendanceMode);
  const tier = activeTier(new Date());

  let attendee = existing;
  if (attendee) {
    attendee = await prisma.attendee.update({
      where: { id: existing!.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        primaryLanguages: primaryLanguages?.trim() || null,
        attendanceMode,
        needsParking: attendanceMode === "in-person" ? !!needsParking : null,
        accessibilityNotes: accessibilityNotes?.trim() || null,
        dietary: dietary?.trim() || null,
        basePriceCents: priceCents,
        finalPriceCents: priceCents,
      },
    });
  } else {
    attendee = await prisma.attendee.create({
      data: {
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        primaryLanguages: primaryLanguages?.trim() || null,
        attendanceMode,
        needsParking: attendanceMode === "in-person" ? !!needsParking : null,
        accessibilityNotes: accessibilityNotes?.trim() || null,
        dietary: dietary?.trim() || null,
        discountPercent: 0,
        basePriceCents: priceCents,
        finalPriceCents: priceCents,
        inviteToken: newAttendeeToken(),
        status: "registered",
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "public_registration_started", meta: tier.id },
    });
  }

  const session = await createCheckoutSession({
    amountCents: priceCents,
    customerEmail: attendee.email,
    productName: attendanceMode === "in-person"
      ? `Conference 2026: In-Person Registration (${tier.label})`
      : `Conference 2026: Virtual Registration (${tier.label})`,
    productDescription: attendanceMode === "in-person"
      ? "Two-day in-person ticket at Lurie Children's, Chicago. August 15 and 16, 2026. Includes lunch, materials, and a CEU certificate for both days."
      : "Two-day virtual ticket with live streamed sessions, on-demand recordings, and a CEU certificate for both days.",
    successUrl: `${appUrl()}/register/success/${attendee.inviteToken}?cs={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl()}/register?resume=${attendee.inviteToken}`,
    metadata: {
      attendeeId: attendee.id,
      attendeeEmail: attendee.email,
      attendanceMode,
      kind: "public_attendee",
    },
  });

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: { stripeSessionId: session.id },
  });
  await prisma.attendeeEvent.create({
    data: { attendeeId: attendee.id, type: "checkout_started", meta: session.id },
  });

  return NextResponse.json({ url: session.url, token: attendee.inviteToken });
}
