import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";
import { confirmAttendeePaid } from "@/lib/attendee-mail";
import { confirmSponsorPaid } from "@/lib/sponsor-confirm";

// Stripe webhook for checkout.session.completed.
// Configure in Stripe dashboard: endpoint URL = https://conference.aalb.org/api/attendees/webhook
// Subscribe to: checkout.session.completed
//
// Accepts either signing secret (attendee or sponsor destination) and
// dispatches BOTH kinds of session: if the team configures a single combined
// Stripe endpoint — at either URL — every payment still confirms. Attendee
// payments previously depended on this exact route being wired with exactly
// STRIPE_WEBHOOK_SECRET; a combined endpoint pointed at the sponsor route
// silently dropped them, and no confirmation email ever went out.
export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const ok = await verifyWebhookSignature(payload, sig, [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_SPONSOR_WEBHOOK_SECRET,
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

  if (obj.metadata?.kind === "sponsor" && obj.metadata?.sponsorId) {
    const result = await confirmSponsorPaid(obj.metadata.sponsorId, opts);
    return NextResponse.json({ received: true, kind: "sponsor", ...result });
  }

  const attendeeId = obj.metadata?.attendeeId;
  if (!attendeeId) {
    return NextResponse.json({ warning: "no attendeeId in metadata" });
  }
  const result = await confirmAttendeePaid(attendeeId, opts);
  return NextResponse.json({ received: true, kind: "attendee", ...result });
}
