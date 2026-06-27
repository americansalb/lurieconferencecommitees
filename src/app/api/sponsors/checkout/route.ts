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

  // VIP courtesy discount: applies to any paid sponsorship level, including the
  // exhibitor table. Computed from the tier's list price (not the stored
  // amount) so a repeated checkout never compounds the discount.
  const applyDiscount = !!sponsor.discountPercent && t.amountCents > 0;
  const chargeCents = applyDiscount
    ? Math.round((t.amountCents * (100 - sponsor.discountPercent!)) / 100)
    : sponsor.amountCents;
  const discountNote = applyDiscount
    ? ` A ${sponsor.discountPercent}% partner courtesy has been applied to the ${t.amountLabel} level.`
    : "";

  const session = await createCheckoutSession({
    amountCents: chargeCents,
    customerEmail: sponsor.contactEmail,
    productName: `Conference 2026: ${t.name}`,
    productDescription: `Sponsorship of the 2026 Lurie Children's & AALB Conference at the ${t.name} level.${t.ticketsIncluded > 0 ? ` Includes ${t.ticketsIncluded} conference ticket${t.ticketsIncluded === 1 ? "" : "s"}.` : " Logo recognition only, no tickets included."} Americans Against Language Barriers is a 501(c)(3) nonprofit;${t.ticketsIncluded > 0 ? " your payment may be tax-deductible (consult your tax advisor)." : " as a logo-only contribution this level is generally fully tax-deductible (consult your tax advisor)."}${discountNote}`,
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
      // Record the actual amount due so the confirmation email and revenue
      // reporting reflect the discounted price, not the list price.
      amountCents: chargeCents,
      status: (sponsor.status === "submitted" || sponsor.status === "invited") ? "awaiting_payment" : sponsor.status,
    },
  });
  if (applyDiscount) {
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "discount_applied", meta: `${sponsor.discountPercent}% -> ${chargeCents}` },
    }).catch(() => {});
  }
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "checkout_started", meta: session.id },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
