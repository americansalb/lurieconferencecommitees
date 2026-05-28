import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";
import { sendMail } from "@/lib/mail";
import { attendeeConfirmedEmail } from "@/lib/mail-templates";
import { attendeeFunnelUrl, attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";

// Stripe webhook for checkout.session.completed.
// Configure in Stripe dashboard: endpoint URL = https://conference.aalb.org/api/attendees/webhook
// Subscribe to: checkout.session.completed
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

  if (event.type === "checkout.session.completed") {
    const obj = event.data.object as {
      id?: string;
      payment_intent?: string;
      amount_total?: number;
      metadata?: Record<string, string>;
    };
    const attendeeId = obj.metadata?.attendeeId;
    if (!attendeeId) {
      return NextResponse.json({ warning: "no attendeeId in metadata" });
    }
    const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } });
    if (!attendee) return NextResponse.json({ warning: "attendee not found" });

    if (!attendee.paid) {
      await prisma.attendee.update({
        where: { id: attendee.id },
        data: {
          paid: true,
          paidAt: new Date(),
          stripePaymentIntentId: typeof obj.payment_intent === "string" ? obj.payment_intent : null,
          status: "paid",
        },
      });
      await prisma.attendeeEvent.create({
        data: {
          attendeeId: attendee.id,
          type: "paid",
          meta: JSON.stringify({ sessionId: obj.id, amount: obj.amount_total }),
        },
      });
      // Confirmation email goes direct, not through the queue — high-value transactional.
      sendMail({
        to: attendee.email,
        subject: "You're in — 2026 Lurie Children's & AALB Conference",
        html: attendeeConfirmedEmail({
          firstName: attendee.firstName,
          url: attendeeFunnelUrl(attendee.inviteToken),
          attendanceMode: attendee.attendanceMode || "in-person",
          finalPriceCents: attendee.finalPriceCents,
        }),
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
      }).catch((e) => console.error("[attendee webhook] mail send error", e));
    }
  }

  return NextResponse.json({ received: true });
}
