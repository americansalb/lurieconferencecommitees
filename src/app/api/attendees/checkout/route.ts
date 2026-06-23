import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePrice } from "@/lib/attendees";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/presenters";
import { validateAndApply, DISCOUNT_ERROR_MESSAGES } from "@/lib/discounts";

export async function POST(req: Request) {
  const { token, discountCode } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const attendee = await prisma.attendee.findUnique({ where: { inviteToken: token } });
  if (!attendee) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (attendee.paid) {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }
  if (!attendee.attendanceMode) {
    return NextResponse.json({ error: "Select attendance mode first" }, { status: 400 });
  }

  // Personal-invite discount first; a shared code (if any) stacks on top of
  // that already-reduced price. All computed server-side.
  const { baseCents, finalCents: afterPersonal } = computePrice(attendee.attendanceMode, attendee.discountPercent);
  if (!afterPersonal) {
    return NextResponse.json({ error: "Unable to compute price" }, { status: 400 });
  }

  let finalCents = afterPersonal;
  let discountCodeId: string | null = null;
  let discountCodeText: string | null = null;
  let codeDiscountCents = 0;
  if (discountCode && String(discountCode).trim()) {
    const outcome = await validateAndApply(String(discountCode), afterPersonal, attendee.attendanceMode);
    if (!outcome.ok) {
      return NextResponse.json({ error: DISCOUNT_ERROR_MESSAGES[outcome.error] }, { status: 400 });
    }
    finalCents = outcome.result.finalCents;
    codeDiscountCents = outcome.result.discountCents;
    discountCodeId = outcome.result.code.id;
    discountCodeText = outcome.result.code.code;
  }

  const isInPerson = attendee.attendanceMode === "in-person";
  const productName = isInPerson
    ? "Conference 2026: In-Person Registration"
    : "Conference 2026: Virtual Registration";
  const personalNote = attendee.discountPercent > 0
    ? ` ${attendee.discountPercent}% personal-invite discount applied.`
    : "";
  const codeNote = discountCodeText ? ` Code ${discountCodeText} applied.` : "";
  const productDescription = (isInPerson
    ? "Two-day in-person ticket, August 15 and 16, 2026."
    : "Two-day virtual ticket with live streamed sessions, August 15 and 16, 2026.") + personalNote + codeNote;

  const session = await createCheckoutSession({
    amountCents: finalCents,
    customerEmail: attendee.email,
    productName,
    productDescription,
    successUrl: `${appUrl()}/attend/${token}/success?cs={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl()}/attend/${token}`,
    metadata: {
      attendeeId: attendee.id,
      attendeeEmail: attendee.email,
      attendanceMode: attendee.attendanceMode,
      ...(discountCodeText ? { discountCode: discountCodeText } : {}),
    },
  });

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: {
      stripeSessionId: session.id,
      basePriceCents: baseCents,
      finalPriceCents: finalCents,
      discountCodeId,
      discountCode: discountCodeText,
      discountCodeCents: codeDiscountCents,
      status: attendee.status === "rsvp_pending" ? "confirmed" : attendee.status,
      confirmedAt: attendee.confirmedAt || new Date(),
    },
  });
  await prisma.attendeeEvent.create({
    data: { attendeeId: attendee.id, type: "checkout_started", meta: session.id },
  });

  // Pending redemption, finalized by the webhook on payment.
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
        attendanceMode: attendee.attendanceMode,
        basePriceCents: afterPersonal,
        discountCents: codeDiscountCents,
        finalPriceCents: finalCents,
        status: "applied",
        stripeSessionId: session.id,
      },
    });
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
