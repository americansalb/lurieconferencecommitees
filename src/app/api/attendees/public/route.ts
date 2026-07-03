import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newAttendeeToken } from "@/lib/attendees";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/presenters";
import { activePriceCents, activeTier, registrationClosed } from "@/components/landing/pricing-data";
import { validateAndApply, DISCOUNT_ERROR_MESSAGES } from "@/lib/discounts";
import { confirmFreeAttendee } from "@/lib/attendee-mail";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// Public registration. Creates an Attendee with no inviting team member,
// computes the price from today's active pricing tier, and returns a
// Stripe Checkout URL the client can redirect to.
export async function POST(req: Request) {
  if (registrationClosed()) {
    return NextResponse.json(
      { error: "Registration for the 2026 conference has closed. Email contact@aalb.org with any questions." },
      { status: 410 }
    );
  }
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
    accessibilityNotes, dietary,
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

  // Optional shared discount code. Validated and priced entirely here; the
  // client's only input is the code string. An invalid code is rejected so
  // the user can correct it rather than silently paying full price.
  let finalCents = priceCents;
  let discountCodeId: string | null = null;
  let discountCodeText: string | null = null;
  let discountCents = 0;
  if (body.discountCode && String(body.discountCode).trim()) {
    const outcome = await validateAndApply(String(body.discountCode), priceCents, attendanceMode);
    if (!outcome.ok) {
      return NextResponse.json({ error: DISCOUNT_ERROR_MESSAGES[outcome.error] }, { status: 400 });
    }
    finalCents = outcome.result.finalCents;
    discountCents = outcome.result.discountCents;
    discountCodeId = outcome.result.code.id;
    discountCodeText = outcome.result.code.code;
  }

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

        accessibilityNotes: accessibilityNotes?.trim() || null,
        dietary: dietary?.trim() || null,
        basePriceCents: priceCents,
        finalPriceCents: finalCents,
        discountCodeId,
        discountCode: discountCodeText,
        discountCodeCents: discountCents,
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

        accessibilityNotes: accessibilityNotes?.trim() || null,
        dietary: dietary?.trim() || null,
        discountPercent: 0,
        basePriceCents: priceCents,
        finalPriceCents: finalCents,
        discountCodeId,
        discountCode: discountCodeText,
        discountCodeCents: discountCents,
        inviteToken: newAttendeeToken(),
        status: "registered",
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "public_registration_started", meta: tier.id },
    });
  }

  // Record the pending redemption (promoted to "redeemed" by the webhook on
  // successful payment). Replace any prior pending row for this attendee so a
  // resumed/abandoned checkout doesn't leave stale applications.
  if (discountCodeId) {
    await prisma.discountRedemption.deleteMany({
      where: { attendeeId: attendee.id, status: "applied" },
    });
    await prisma.discountRedemption.create({
      data: {
        codeId: discountCodeId,
        code: discountCodeText!,
        attendeeId: attendee.id,
        attendeeEmail: attendee.email,
        attendanceMode,
        basePriceCents: priceCents,
        discountCents,
        finalPriceCents: finalCents,
        status: "applied",
      },
    });
  }

  // A 100%-off code (e.g. partner staff tickets) means nothing to charge.
  // Stripe payment-mode sessions reject zero totals, so complete the
  // registration directly and land them on the same success page.
  if (finalCents === 0) {
    await confirmFreeAttendee(attendee.id);
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "free_registration_completed", meta: discountCodeText },
    }).catch(() => {});
    return NextResponse.json({
      url: `${appUrl()}/register/success/${attendee.inviteToken}`,
      token: attendee.inviteToken,
      free: true,
    });
  }

  const codeSuffix = discountCodeText ? `, code ${discountCodeText}` : "";
  const session = await createCheckoutSession({
    amountCents: finalCents,
    customerEmail: attendee.email,
    productName: attendanceMode === "in-person"
      ? `Conference 2026: In-Person Registration (${tier.label})`
      : `Conference 2026: Virtual Registration (${tier.label})`,
    productDescription: (attendanceMode === "in-person"
      ? "Two-day in-person ticket at Lurie Children's, Chicago. August 15 and 16, 2026. Includes lunch, materials, and a CEU certificate for both days."
      : "Two-day virtual ticket with live streamed sessions, on-demand recordings, and a CEU certificate for both days.") + codeSuffix,
    successUrl: `${appUrl()}/register/success/${attendee.inviteToken}?cs={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl()}/register?resume=${attendee.inviteToken}`,
    metadata: {
      attendeeId: attendee.id,
      attendeeEmail: attendee.email,
      attendanceMode,
      kind: "public_attendee",
      ...(discountCodeText ? { discountCode: discountCodeText } : {}),
    },
  });

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: { stripeSessionId: session.id },
  });
  if (discountCodeId) {
    await prisma.discountRedemption.updateMany({
      where: { attendeeId: attendee.id, status: "applied" },
      data: { stripeSessionId: session.id },
    });
  }
  await prisma.attendeeEvent.create({
    data: { attendeeId: attendee.id, type: "checkout_started", meta: session.id },
  });

  return NextResponse.json({ url: session.url, token: attendee.inviteToken });
}
