import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tierById } from "@/lib/sponsors";
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

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Invalid application" }, { status: 404 });
  if (sponsor.paid) return NextResponse.json({ error: "Already paid" }, { status: 409 });
  if (sponsor.amountCents <= 0) {
    return NextResponse.json({ error: "This tier does not require payment." }, { status: 400 });
  }

  const t = tierById(sponsor.tier);
  if (!t) return NextResponse.json({ error: "Unknown tier" }, { status: 400 });

  const session = await createCheckoutSession({
    amountCents: sponsor.amountCents,
    customerEmail: sponsor.contactEmail,
    productName: `Conference 2026 — ${t.name}`,
    productDescription: `Sponsorship of the 2026 Lurie Children's & AALB Conference at the ${t.name} level. Tax-deductible under IRS code 501(c)(3). ${t.ticketsIncluded} conference ticket${t.ticketsIncluded === 1 ? "" : "s"} included.`,
    successUrl: `${appUrl()}/sponsor/success/${token}?cs={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl()}/sponsor/status/${token}`,
    metadata: {
      kind: "sponsor",
      sponsorId: sponsor.id,
      sponsorEmail: sponsor.contactEmail,
      tier: sponsor.tier,
    },
  });

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      stripeSessionId: session.id,
      status: sponsor.status === "submitted" ? "awaiting_payment" : sponsor.status,
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "checkout_started", meta: session.id },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
