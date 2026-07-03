import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { confirmAttendeePaid } from "@/lib/attendee-mail";

// Admin backfill for registrations stranded by a missed/misrouted Stripe
// webhook. Two damage classes, both healed here:
//
// 1. Charged but never marked paid: attendees with a stored checkout session
//    and paid=false. We verify each session directly with Stripe; the ones
//    Stripe says are paid get confirmed (which also sends the confirmation
//    email they never received).
// 2. Marked paid but never emailed: pass { resendReceipts: true } to re-send
//    the confirmation to paid attendees with no paid_email_sent event on
//    record. Attendees confirmed by the pre-fix webhook have no such event
//    even when their email did go out, so this can re-deliver a receipt some
//    already have — harmless, but that's why it's opt-in.
//
// Idempotent and safe to run repeatedly; POST { dryRun: true } to preview.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = Boolean(body?.dryRun);
  const resendReceipts = Boolean(body?.resendReceipts);

  // Class 1: unpaid records that reached Stripe checkout.
  const candidates = await prisma.attendee.findMany({
    where: { paid: false, stripeSessionId: { not: null } },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: { id: true, email: true, stripeSessionId: true, finalPriceCents: true },
  });

  const confirmed: string[] = [];
  const unpaidAtStripe: string[] = [];
  const flagged: { email: string; error: string }[] = [];
  for (const a of candidates) {
    try {
      const verified = await retrieveCheckoutSession(a.stripeSessionId!);
      if (!verified?.paid) { unpaidAtStripe.push(a.email); continue; }
      if (verified.metadata?.attendeeId !== a.id) {
        flagged.push({ email: a.email, error: "session does not belong to this attendee" });
        continue;
      }
      if (dryRun) { confirmed.push(a.email); continue; }
      const result = await confirmAttendeePaid(a.id, {
        paymentIntentId: verified.paymentIntentId,
        amountTotal: verified.amountTotal,
        sessionId: verified.id,
        source: "reconcile",
      });
      if (result.ok) confirmed.push(a.email);
      else flagged.push({ email: a.email, error: result.error || "confirm failed" });
    } catch (e) {
      flagged.push({ email: a.email, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Class 2 (opt-in): paid attendees with no receipt event on record.
  const reEmailed: string[] = [];
  if (resendReceipts) {
    const paid = await prisma.attendee.findMany({
      where: {
        paid: true,
        unsubscribedAt: null,
        events: { none: { type: "paid_email_sent" } },
      },
      orderBy: { paidAt: "asc" },
      take: 500,
      select: { id: true, email: true },
    });
    for (const a of paid) {
      if (dryRun) { reEmailed.push(a.email); continue; }
      const result = await confirmAttendeePaid(a.id, { forceEmail: true, source: "reconcile" });
      if (result.emailed) reEmailed.push(a.email);
      else flagged.push({ email: a.email, error: result.error || "email not sent" });
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    checked: candidates.length,
    confirmed,
    reEmailed,
    unpaidAtStripe: unpaidAtStripe.length,
    flagged,
  });
}
