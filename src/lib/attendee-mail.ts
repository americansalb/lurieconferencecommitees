import { prisma } from "./db";
import { sendMail } from "./mail";
import { attendeePortalLinkEmail, attendeeBroadcastEmail, attendeeConfirmedEmail } from "./mail-templates";
import { attendeeFromHeader, attendeeReplyTo, attendeeFunnelUrl } from "./attendees";
import { appUrl } from "./presenters";

// Complete a $0 registration (a 100%-off code, e.g. partner staff tickets).
// Stripe payment-mode checkout rejects zero totals, so free registrations
// never reach Stripe: this mirrors what the payment webhook does — mark paid,
// finalize the discount redemption, and send the confirmation.
export async function confirmFreeAttendee(attendeeId: string): Promise<void> {
  const attendee = await prisma.attendee.findUnique({ where: { id: attendeeId } });
  if (!attendee || attendee.paid) return;

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: { paid: true, paidAt: new Date(), status: "paid" },
  });
  await prisma.attendeeEvent.create({
    data: {
      attendeeId: attendee.id,
      type: "paid",
      meta: JSON.stringify({ amount: 0, source: "free_registration" }),
    },
  }).catch(() => {});

  // Promote the pending redemption and bump the code tally, exactly as the
  // webhook does for paid checkouts (guarded so a re-run can't double-count).
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

  const url = attendee.invitedById
    ? attendeeFunnelUrl(attendee.inviteToken)
    : `${appUrl()}/register/success/${attendee.inviteToken}`;
  sendMail({
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
  }).catch((e) => console.error("[free registration] mail send error", e));
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
