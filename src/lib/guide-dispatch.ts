import { prisma } from "./db";
import { sendMail } from "./mail";
import { appUrl } from "./presenters";
import { attendeeFromHeader, attendeeReplyTo } from "./attendees";
import { attendeeGuideEmail } from "./mail-templates";

// Send the conference guide automatically, a few minutes after someone
// registers in person.
//
// Run from the in-app scheduler on the same tick as the email queue, so this
// is a sweeper rather than a timer attached to a request: if the process
// restarts between someone paying and their guide going out, the next tick
// still picks them up.

// Long enough that the guide does not land on top of the payment receipt and
// look like a double send.
export const GUIDE_DELAY_MINUTES = 5;

// The safety rail. Without an upper bound, switching this on would sweep every
// in-person attendee who has ever paid and email the whole room at once. Only
// recent registrations qualify; the backlog stays with the manual button on
// the Attendees page, where it can be reviewed before it goes.
export const GUIDE_WINDOW_HOURS = 24;

// Belt and braces on a tick: a spike of registrations should trickle out
// rather than fire fifty attachments at the sending domain in one minute.
const MAX_PER_TICK = 20;

function autoSendEnabled(): boolean {
  // Deliberately opt-out: the feature was asked for, and a missing env var
  // should not silently disable it. Set GUIDE_AUTOSEND=off to stop it without
  // a code change.
  return (process.env.GUIDE_AUTOSEND || "").trim().toLowerCase() !== "off";
}

export async function dispatchDueGuides(): Promise<{ sent: number; failed: number }> {
  if (!autoSendEnabled()) return { sent: 0, failed: 0 };

  const now = Date.now();
  const readyBefore = new Date(now - GUIDE_DELAY_MINUTES * 60_000);
  const notOlderThan = new Date(now - GUIDE_WINDOW_HOURS * 3_600_000);

  const due = await prisma.attendee.findMany({
    where: {
      paid: true,
      isTest: false,
      unsubscribedAt: null,
      // The guide is the in-person document. Virtual attendees are left out
      // here exactly as they are in the manual bulk send.
      attendanceMode: { not: "virtual" },
      guideSentAt: null,
      paidAt: { lte: readyBefore, gte: notOlderThan },
    },
    include: { sponsor: { select: { companyName: true } } },
    orderBy: { paidAt: "asc" },
    take: MAX_PER_TICK,
  });
  if (!due.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const a of due) {
    // Claim the row before sending. Two app instances tick independently, and
    // a conditional update is what stops both of them mailing the same person.
    const claim = await prisma.attendee.updateMany({
      where: { id: a.id, guideSentAt: null },
      data: { guideSentAt: new Date() },
    });
    if (claim.count === 0) continue;

    try {
      await sendMail({
        to: a.email,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
        subject: "Your guide to the conference",
        html: attendeeGuideEmail({
          firstName: a.firstName,
          lastName: a.lastName,
          portalUrl: `${appUrl()}/attend/${a.inviteToken}`,
          attendanceMode: a.attendanceMode,
          attendDay: a.attendDay,
          dietary: a.dietary,
          accessibilityNotes: a.accessibilityNotes,
          primaryLanguages: a.primaryLanguages,
          needsParking: a.needsParking,
          sponsorName: a.sponsor?.companyName ?? null,
          assetBase: appUrl(),
        }),
        attachments: [{
          filename: "2026-conference-attendee-guide.pdf",
          path: `${appUrl()}/guides/attendee-guide.pdf`,
        }],
      });
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "guide_sent", meta: "automatic" } })
        .catch(() => {});
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[guides] auto-send failed", a.email, msg);
      // Hand the claim back so the next tick retries, and leave a trace on the
      // person rather than only in the server log.
      await prisma.attendee
        .updateMany({ where: { id: a.id }, data: { guideSentAt: null } })
        .catch(() => {});
      await prisma.attendeeEvent
        .create({ data: { attendeeId: a.id, type: "guide_send_failed", meta: `automatic: ${msg}`.slice(0, 300) } })
        .catch(() => {});
      failed++;
    }
  }

  return { sent, failed };
}
