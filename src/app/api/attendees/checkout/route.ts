import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePrice, oneDayInviteBaseCents } from "@/lib/attendees";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/presenters";
import { validateAndApply, normalizeCode, DISCOUNT_ERROR_MESSAGES } from "@/lib/discounts";
import { firstNameToCode } from "@/lib/codes";
import { confirmFreeAttendee } from "@/lib/attendee-mail";

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
  // that already-reduced price. All computed server-side. A one-day virtual
  // ticket starts from the one-day base instead of the full virtual rate.
  const oneDay = attendee.attendanceMode === "virtual" && (attendee.attendDay === "sat" || attendee.attendDay === "sun")
    ? attendee.attendDay
    : null;
  let baseCents: number | null;
  let afterPersonal: number | null;
  if (oneDay) {
    baseCents = oneDayInviteBaseCents();
    afterPersonal = Math.round(baseCents * (100 - attendee.discountPercent) / 100);
  } else {
    ({ baseCents, finalCents: afterPersonal } = computePrice(attendee.attendanceMode, attendee.discountPercent));
  }
  if (!afterPersonal) {
    return NextResponse.json({ error: "Unable to compute price" }, { status: 400 });
  }

  let finalCents = afterPersonal;
  let discountCodeId: string | null = null;
  let discountCodeText: string | null = null;
  let codeDiscountCents = 0;
  // A recipient's own first-name code is the same discount already applied
  // through their personal link, so it never stacks on itself (cap at the
  // personal rate). Other codes still apply on top.
  const ownCodeRedundant =
    attendee.discountPercent > 0 &&
    !!discountCode &&
    normalizeCode(String(discountCode)) === firstNameToCode(attendee.firstName);
  if (discountCode && String(discountCode).trim() && !ownCodeRedundant) {
    const outcome = await validateAndApply(String(discountCode), afterPersonal, attendee.attendanceMode);
    if (!outcome.ok) {
      return NextResponse.json({ error: DISCOUNT_ERROR_MESSAGES[outcome.error] }, { status: 400 });
    }
    finalCents = outcome.result.finalCents;
    codeDiscountCents = outcome.result.discountCents;
    discountCodeId = outcome.result.code.id;
    discountCodeText = outcome.result.code.code;
  }

  // A 100%-off code (e.g. partner staff tickets) leaves nothing to charge;
  // Stripe payment-mode sessions reject zero totals. Persist the pricing and
  // redemption exactly as the paid path would, then complete directly.
  if (finalCents === 0) {
    await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        basePriceCents: baseCents,
        finalPriceCents: finalCents,
        discountCodeId,
        discountCode: discountCodeText,
        discountCodeCents: codeDiscountCents,
        status: attendee.status === "rsvp_pending" ? "confirmed" : attendee.status,
        confirmedAt: attendee.confirmedAt || new Date(),
      },
    });
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
        },
      });
    }
    await confirmFreeAttendee(attendee.id);
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "free_registration_completed", meta: discountCodeText },
    }).catch(() => {});
    return NextResponse.json({ url: `${appUrl()}/attend/${token}/success`, free: true });
  }

  const isInPerson = attendee.attendanceMode === "in-person";
  const productName = isInPerson
    ? "Conference 2026: In-Person Registration"
    : oneDay
    ? `Conference 2026: Virtual One-Day Registration, ${oneDay === "sat" ? "Saturday Aug 15" : "Sunday Aug 16"}`
    : "Conference 2026: Virtual Registration";
  const personalNote = attendee.discountPercent > 0
    ? ` ${attendee.discountPercent}% personal-invite discount applied.`
    : "";
  const codeNote = discountCodeText ? ` Code ${discountCodeText} applied.` : "";
  const productDescription = (isInPerson
    ? "Two-day in-person ticket, August 15 and 16, 2026."
    : oneDay
    ? `One-day virtual ticket with live streamed sessions, ${oneDay === "sat" ? "Saturday, August 15, 2026" : "Sunday, August 16, 2026"}.`
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
