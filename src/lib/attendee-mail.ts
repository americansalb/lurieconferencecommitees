import { prisma } from "./db";
import { sendMail } from "./mail";
import { attendeePortalLinkEmail, attendeeBroadcastEmail } from "./mail-templates";
import { attendeeFromHeader, attendeeReplyTo, attendeeFunnelUrl } from "./attendees";

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
