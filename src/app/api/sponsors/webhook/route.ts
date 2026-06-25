import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";
import { confirmSponsorPaid } from "@/lib/sponsor-confirm";

// Stripe webhook for sponsor checkout.session.completed events.
// Configure in Stripe dashboard: endpoint URL = https://conference.aalb.org/api/sponsors/webhook
// Subscribe to: checkout.session.completed
//
// Signing secret: if sponsor payments use their own Stripe destination, set
// STRIPE_SPONSOR_WEBHOOK_SECRET to that endpoint's secret. We also accept the
// shared STRIPE_WEBHOOK_SECRET, so a single combined destination still works.
export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const ok = await verifyWebhookSignature(payload, sig, [
    process.env.STRIPE_SPONSOR_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET,
  ]);
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const obj = event.data.object as {
    id?: string;
    payment_intent?: string;
    amount_total?: number;
    metadata?: Record<string, string>;
  };
  if (obj.metadata?.kind !== "sponsor") {
    return NextResponse.json({ received: true, ignored: "non-sponsor session" });
  }

  const sponsorId = obj.metadata?.sponsorId;
  if (!sponsorId) return NextResponse.json({ warning: "no sponsorId in metadata" });

  const result = await confirmSponsorPaid(sponsorId, {
    paymentIntentId: typeof obj.payment_intent === "string" ? obj.payment_intent : null,
    amountTotal: typeof obj.amount_total === "number" ? obj.amount_total : null,
    sessionId: obj.id ?? null,
    source: "webhook",
  });

  return NextResponse.json({ received: true, ...result });
}
