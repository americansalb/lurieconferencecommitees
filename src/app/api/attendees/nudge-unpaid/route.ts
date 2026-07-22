import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildFinishRegistrationNudge, attendeeFromHeader, attendeeReplyTo, attendeeBcc, attendeeUnsubHeaders } from "@/lib/attendees";
import { sendMail } from "@/lib/mail";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// The "almost registered" cohort: they started signing up (picked a ticket;
// registered/confirmed rows reached the Stripe page, rsvp_pending rows saved
// their details) and never paid. Matches attendeeStep()'s "registering"
// bucket, so counts here agree with the Registering chip on the list.
const STARTED_NOT_PAID = ["registered", "rsvp_pending", "confirmed"];

const WHERE = {
  paid: false,
  isTest: false,
  unsubscribedAt: null,
  status: { in: STARTED_NOT_PAID },
} as const;

// Same ceiling as attendee broadcasts: a hand-picked selection goes out
// immediately, but never more than this many mailboxes in one click.
const MAX_IMMEDIATE = 100;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [count, total] = await Promise.all([
    prisma.attendee.count({ where: { ...WHERE, nudgeCount: 0 } }),
    prisma.attendee.count({ where: WHERE }),
  ]);
  // count = eligible and never reminded; total = everyone in the bucket.
  return NextResponse.json({ count, total });
}

// Send the finish-registration nudge. Two modes with different delivery:
//   - { ids: [...] }  (the list's bulk bar): the selected started-not-paid
//     people get the note RIGHT NOW — a hand-picked selection is a broadcast,
//     not a drip — capped at MAX_IMMEDIATE per click, with the same From,
//     unsubscribe headers, and suppression rules as the paced path.
//     Ineligible selections (paid, declined, unsubscribed, test, or not in
//     the bucket) are skipped and reported.
//   - no body / {}    (the invite-tab card): everyone in the bucket who has
//     NEVER been nudged, paced through the shared queue — so re-running it
//     after new people abandon checkout only touches the new people.
// Both bump nudgeCount/lastNudgedAt (the row's "1st/2nd reminder" chip) and
// supersede any still-pending queued email for the same person.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;

  const body = await req.json().catch(() => ({} as { ids?: unknown }));
  const ids = Array.isArray((body as { ids?: unknown }).ids)
    ? ((body as { ids: unknown[] }).ids.filter((x): x is string => typeof x === "string"))
    : null;

  // ---- Selection mode: send immediately -----------------------------------
  if (ids && ids.length) {
    const capped = ids.slice(0, MAX_IMMEDIATE);
    const targets = await prisma.attendee.findMany({
      where: { ...WHERE, id: { in: capped } },
      orderBy: { createdAt: "asc" },
    });
    const skipped = ids.length - targets.length;
    let sent = 0;
    let failed = 0;
    for (const a of targets) {
      // Supersede any still-pending paced send so this doesn't double up.
      await prisma.emailQueue.updateMany({
        where: { recipientType: "attendee", recipientId: a.id, status: "pending" },
        data: { status: "cancelled" },
      }).catch(() => {});
      const { subject, html } = buildFinishRegistrationNudge({
        firstName: a.firstName,
        inviteToken: a.inviteToken,
        discountPercent: a.discountPercent,
        attendanceMode: a.attendanceMode,
        attendDay: a.attendDay,
        finalPriceCents: a.finalPriceCents,
      });
      try {
        await sendMail({
          to: a.email,
          subject,
          html,
          from: attendeeFromHeader(),
          replyTo: attendeeReplyTo(),
          bcc: attendeeBcc(),
          headers: attendeeUnsubHeaders(a.inviteToken),
        });
        await prisma.attendee.update({
          where: { id: a.id },
          data: { nudgeCount: { increment: 1 }, lastNudgedAt: new Date(), lastSentAt: new Date() },
        }).catch(() => {});
        await prisma.attendeeEvent.create({
          data: { attendeeId: a.id, type: "finish_nudge_sent", actorEmail: adminEmail },
        }).catch(() => {});
        sent++;
      } catch (e) {
        console.error("[nudge-unpaid] immediate send failed", a.email, e);
        failed++;
      }
    }
    return NextResponse.json({ sent, failed, skipped });
  }

  // ---- Bulk mode: never-reminded people, paced through the queue ----------
  const targets = await prisma.attendee.findMany({
    where: { ...WHERE, nudgeCount: 0 },
    orderBy: { createdAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ queued: 0, skipped: 0 });

  const policy = await getPolicy();
  const times = await planSendTimes(targets.length, policy);
  const batchId = `attendee-finish-nudge-${Date.now()}`;

  let queued = 0;
  for (let i = 0; i < targets.length; i++) {
    const a = targets[i];
    await prisma.emailQueue.updateMany({
      where: { recipientType: "attendee", recipientId: a.id, status: "pending" },
      data: { status: "cancelled" },
    }).catch(() => {});
    const { subject, html } = buildFinishRegistrationNudge({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      attendanceMode: a.attendanceMode,
      attendDay: a.attendDay,
      finalPriceCents: a.finalPriceCents,
    });
    await prisma.emailQueue.create({
      data: {
        batchId,
        recipientType: "attendee",
        recipientId: a.id,
        to: a.email,
        subject,
        html,
        scheduledFor: times[i],
        status: "pending",
      },
    });
    await prisma.attendee.update({
      where: { id: a.id },
      data: { nudgeCount: { increment: 1 }, lastNudgedAt: new Date() },
    }).catch(() => {});
    await prisma.attendeeEvent.create({
      data: { attendeeId: a.id, type: "finish_nudge_queued", actorEmail: adminEmail },
    }).catch(() => {});
    queued++;
  }

  return NextResponse.json({ queued, skipped: 0 });
}
