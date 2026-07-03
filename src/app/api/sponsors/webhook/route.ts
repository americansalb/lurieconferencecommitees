import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";
import { confirmSponsorPaid } from "@/lib/sponsor-confirm";
import { confirmAttendeePaid } from "@/lib/attendee-mail";

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
  const opts = {
    paymentIntentId: typeof obj.payment_intent === "string" ? obj.payment_intent : null,
    amountTotal: typeof obj.amount_total === "number" ? obj.amount_total : null,
    sessionId: obj.id ?? null,
    source: "webhook",
  };

  // Cross-dispatch: a single combined Stripe destination pointed here used to
  // discard attendee payments as "non-sponsor session" — those attendees were
  // never marked paid and never received their confirmation email.
  if (obj.metadata?.kind !== "sponsor") {
    const attendeeId = obj.metadata?.attendeeId;
    if (attendeeId) {
      const result = await confirmAttendeePaid(attendeeId, opts);
      return NextResponse.json({ received: true, kind: "attendee", ...result });
    }
    return NextResponse.json({ received: true, ignored: "unrecognized session" });
  }

  const sponsorId = obj.metadata?.sponsorId;
  if (!sponsorId) return NextResponse.json({ warning: "no sponsorId in metadata" });

  const result = await confirmSponsorPaid(sponsorId, opts);

  return NextResponse.json({ received: true, kind: "sponsor", ...result });
}
