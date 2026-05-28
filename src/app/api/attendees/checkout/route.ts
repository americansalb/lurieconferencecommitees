import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePrice } from "@/lib/attendees";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/presenters";

export async function POST(req: Request) {
  const { token } = await req.json();
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

  const { baseCents, finalCents } = computePrice(attendee.attendanceMode, attendee.discountPercent);
  if (!finalCents) {
    return NextResponse.json({ error: "Unable to compute price" }, { status: 400 });
  }

  const isInPerson = attendee.attendanceMode === "in-person";
  const productName = isInPerson
    ? "Conference 2026 — In-Person Registration"
    : "Conference 2026 — Virtual Registration";
  const productDescription = isInPerson
    ? `Two-day in-person ticket, Aug 15–16, 2026. ${attendee.discountPercent}% personal-invite discount applied.`
    : "Two-day virtual ticket with live streamed sessions, Aug 15–16, 2026.";

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
    },
  });

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: {
      stripeSessionId: session.id,
      basePriceCents: baseCents,
      finalPriceCents: finalCents,
      status: attendee.status === "rsvp_pending" ? "confirmed" : attendee.status,
      confirmedAt: attendee.confirmedAt || new Date(),
    },
  });
  await prisma.attendeeEvent.create({
    data: { attendeeId: attendee.id, type: "checkout_started", meta: session.id },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
