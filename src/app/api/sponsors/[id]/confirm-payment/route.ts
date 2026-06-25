import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmSponsorPaid } from "@/lib/sponsor-confirm";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Admin "Confirm payment": verifies the sponsor's checkout session directly with
// Stripe and, if it shows paid, marks them paid and sends the confirmation. Use
// this to recover a payment the webhook never delivered. Never marks paid
// without Stripe confirming the money is actually there.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actorEmail = session?.user?.email || null;

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already recorded as paid: just (re)send the confirmation email.
  if (sponsor.paid) {
    const r = await confirmSponsorPaid(sponsor.id, { actorEmail, source: "admin", forceEmail: true });
    return NextResponse.json({ ...r, verified: true, paidOnStripe: true });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  if (!sponsor.stripeSessionId) {
    return NextResponse.json(
      { error: "No Stripe checkout on file for this sponsor. They never started payment." },
      { status: 409 }
    );
  }

  let verified;
  try {
    verified = await retrieveCheckoutSession(sponsor.stripeSessionId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Stripe lookup failed" }, { status: 502 });
  }
  if (!verified) return NextResponse.json({ error: "Stripe could not find this checkout session." }, { status: 404 });
  if (!verified.paid) {
    return NextResponse.json({ ok: false, verified: true, paidOnStripe: false, error: "Stripe shows this checkout has not been paid." });
  }

  const r = await confirmSponsorPaid(sponsor.id, {
    paymentIntentId: verified.paymentIntentId,
    amountTotal: verified.amountTotal,
    sessionId: verified.id,
    actorEmail,
    source: "admin",
  });
  return NextResponse.json({ ...r, verified: true, paidOnStripe: true });
}
