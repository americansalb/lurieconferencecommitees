import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";
import { sendMail } from "@/lib/mail";
import { sponsorPaidEmail } from "@/lib/mail-templates";
import { sponsorFromHeader, sponsorReplyTo, sponsorStatusUrl, tierById } from "@/lib/sponsors";

// Stripe webhook for sponsor checkout.session.completed events.
// Configure in Stripe dashboard: endpoint URL = https://conference.aalb.org/api/sponsors/webhook
// Subscribe to: checkout.session.completed
// Same STRIPE_WEBHOOK_SECRET as the attendee webhook is fine; one secret per endpoint.
export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  const ok = await verifyWebhookSignature(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
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

  const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } });
  if (!sponsor) return NextResponse.json({ warning: "sponsor not found" });

  if (!sponsor.paid) {
    await prisma.sponsor.update({
      where: { id: sponsor.id },
      data: {
        paid: true,
        paidAt: new Date(),
        stripePaymentIntentId: typeof obj.payment_intent === "string" ? obj.payment_intent : null,
        status: "paid",
      },
    });
    await prisma.sponsorEvent.create({
      data: {
        sponsorId: sponsor.id,
        type: "paid",
        meta: JSON.stringify({ sessionId: obj.id, amount: obj.amount_total }),
      },
    });
    const t = tierById(sponsor.tier);
    sendMail({
      to: sponsor.contactEmail,
      subject: `Thank you for sponsoring the 2026 Lurie Children's and AALB Conference`,
      html: sponsorPaidEmail({
        firstName: sponsor.contactName.split(" ")[0],
        companyName: sponsor.companyName,
        tierName: t?.name || sponsor.tier,
        amountCents: sponsor.amountCents,
        statusUrl: sponsorStatusUrl(sponsor.applicationToken),
      }),
      from: sponsorFromHeader(),
      replyTo: sponsorReplyTo(),
    }).catch((e) => console.error("[sponsor webhook] mail send error", e));
  }

  return NextResponse.json({ received: true });
}
