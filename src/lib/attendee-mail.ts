import { prisma } from "./db";
import { sendMail } from "./mail";
import { attendeePortalLinkEmail, attendeeBroadcastEmail, attendeeConfirmedEmail } from "./mail-templates";
import { attendeeFromHeader, attendeeReplyTo, attendeeFunnelUrl } from "./attendees";
import { appUrl } from "./presenters";

export type AttendeeConfirmResult = {
  ok: boolean;
  alreadyPaid: boolean;
  emailed: boolean;
  error?: string;
};

// Idempotently mark an attendee paid and send their confirmation email.
//
// The single source of truth for "an attendee's payment landed", called from
// the Stripe webhook, the post-payment success pages (which verify the session
// directly with Stripe, so a missed webhook can't strand a paid attendee with
// no confirmation), and the free-registration path. Mirrors confirmSponsorPaid:
// the paid write happens before the email so the money is never lost to a mail
// failure, and a Stripe-verified amount must match what the attendee owes.
export async function confirmAttendeePaid(
  attendeeId: string,
  opts: {
    paymentIntentId?: string | null;
    amountTotal?: number | null;
    sessionId?: string | null;
    source?: string;      // "webhook" | "success_page" | "free_registration" | "reconcile"
    forceEmail?: boolean; // re-send the confirmation even if already paid
  } = {}
): Promise<AttendeeConfirmResult> {
  const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return { ok: false, alreadyPaid: false, emailed: false, error: "Attendee not found" };

  const wasPaid = attendee.paid;
  if (wasPaid && !opts.forceEmail) return { ok: true, alreadyPaid: true, emailed: false };

  if (!wasPaid) {
    // A verified Stripe amount must match the price we computed at checkout —
    // a mismatch means a stale or foreign session; flag it for a human.
    if (
      typeof opts.amountTotal === "number" &&
      attendee.finalPriceCents != null &&
      opts.amountTotal !== attendee.finalPriceCents
    ) {
      await prisma.attendeeEvent.create({
        data: {
          attendeeId: attendee.id,
          type: "payment_amount_mismatch",
          meta: JSON.stringify({
            expectedCents: attendee.finalPriceCents,
            receivedCents: opts.amountTotal,
            sessionId: opts.sessionId ?? null,
            source: opts.source || "system",
          }).slice(0, 300),
        },
      }).catch(() => {});
      return {
        ok: false,
        alreadyPaid: false,
        emailed: false,
        error: `Payment of ${opts.amountTotal} does not match the expected ${attendee.finalPriceCents}; flagged for review.`,
      };
    }

    await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        paid: true,
        paidAt: new Date(),
        stripePaymentIntentId: opts.paymentIntentId ?? attendee.stripePaymentIntentId ?? null,
        status: "paid",
      },
    });
    await prisma.attendeeEvent.create({
      data: {
        attendeeId: attendee.id,
        type: "paid",
        meta: JSON.stringify({
          sessionId: opts.sessionId ?? attendee.stripeSessionId,
          amount: opts.amountTotal,
          source: opts.source || "system",
        }),
      },
    }).catch(() => {});

    // Promote the pending redemption and bump the code tally (guarded on the
    // still-pending row so duplicate deliveries can't double-count).
    if (attendee.discountCodeId) {
      const pending = await prisma.discountRedemption.findFirst({
        where: { attendeeId: attendee.id, status: "applied" },
      });
      if (pending) {
        await prisma.discountRedemption.update({
          where: { id: pending.id },
          data: { status: "redeemed", redeemedAt: new Date() },
        });
        await prisma.discountCode.update({
          where: { id: attendee.discountCodeId },
          data: { redeemedCount: { increment: 1 } },
        });
      }
    }
  }

  // Confirmation email. Public registrations link to the receipt page;
  // invited attendees go back to the funnel page they came from.
  const url = attendee.invitedById
    ? attendeeFunnelUrl(attendee.inviteToken)
    : `${appUrl()}/register/success/${attendee.inviteToken}`;
  try {
    await sendMail({
      to: attendee.email,
      subject: "You're in: 2026 Lurie Children's and AALB Conference",
      html: attendeeConfirmedEmail({
        firstName: attendee.firstName,
        url,
        attendanceMode: attendee.attendanceMode || "in-person",
        finalPriceCents: attendee.finalPriceCents,
      }),
      from: attendeeFromHeader(),
      replyTo: attendeeReplyTo(),
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "paid_email_sent", meta: opts.source || null },
    }).catch(() => {});
    return { ok: true, alreadyPaid: wasPaid, emailed: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "paid_email_failed", meta: msg.slice(0, 300) },
    }).catch(() => {});
    // Paid state is recorded; only the email failed. Surface it, don't throw.
    return { ok: true, alreadyPaid: wasPaid, emailed: false, error: msg };
  }
}

// Complete a $0 registration (a 100%-off code, e.g. partner staff tickets).
// Stripe payment-mode checkout rejects zero totals, so free registrations
// never reach Stripe; this is the same confirmation the webhook would run.
export async function confirmFreeAttendee(attendeeId: string): Promise<void> {
  await confirmAttendeePaid(attendeeId, { amountTotal: 0, source: "free_registration" });
}

// Admin-initiated mail to people already in the system (registered/invited).
// Sent immediately (not through the cold-invite queue) in small parallel
// batches so a broadcast to the whole list doesn't time out or hammer Resend.
async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

function escapeBody(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, "<br>");
}

export async function sendPortalLinkTo(attendeeIds: string[]): Promise<{ sent: number; failed: number }> {
  const attendees = await prisma.attendee.findMany({ where: { id: { in: attendeeIds } } });
  let sent = 0, failed = 0;
  await inBatches(attendees, 12, async (a) => {
    try {
      await sendMail({
        to: a.email,
        subject: "Your portal for the 2026 Lurie Children's & AALB Conference",
        html: attendeePortalLinkEmail({ firstName: a.firstName, portalUrl: attendeeFunnelUrl(a.inviteToken), attendanceMode: a.attendanceMode }),
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
      });
      await prisma.attendeeEvent.create({ data: { attendeeId: a.id, type: "portal_link_sent" } }).catch(() => {});
      sent++;
    } catch (e) {
      console.error("[attendee-mail] portal link failed", a.email, e);
      failed++;
    }
  });
  return { sent, failed };
}

export async function sendBroadcastTo(
  attendeeIds: string[],
  subject: string,
  bodyText: string,
  cta?: { url: string; label: string } | null,
): Promise<{ sent: number; failed: number }> {
  const attendees = await prisma.attendee.findMany({ where: { id: { in: attendeeIds } } });
  const bodyHtml = escapeBody(bodyText);
  let sent = 0, failed = 0;
  await inBatches(attendees, 12, async (a) => {
    try {
      await sendMail({
        to: a.email,
        subject,
        html: attendeeBroadcastEmail({ firstName: a.firstName, bodyHtml, ctaUrl: cta?.url, ctaLabel: cta?.label }),
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
      });
      await prisma.attendeeEvent.create({ data: { attendeeId: a.id, type: "broadcast_sent", meta: subject.slice(0, 120) } }).catch(() => {});
      sent++;
    } catch (e) {
      console.error("[attendee-mail] broadcast failed", a.email, e);
      failed++;
    }
  });
  return { sent, failed };
}
