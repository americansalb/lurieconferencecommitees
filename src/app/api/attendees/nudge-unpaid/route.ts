import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildFinishRegistrationNudge } from "@/lib/attendees";
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

// Queue the finish-registration nudge, paced through the shared email queue.
// Two modes:
//   - no body / {}        -> everyone in the bucket who has NEVER been
//                            nudged (nudgeCount 0), so re-running after new
//                            people abandon checkout only touches the new
//                            people;
//   - { ids: [...] }      -> exactly the selected people (the list's bulk
//                            bar), including already-reminded ones — that's
//                            an explicit admin choice. Ineligible selections
//                            (paid, declined, unsubscribed, test, or not in
//                            the started-not-paid bucket) are still skipped
//                            and reported.
// Every queued nudge bumps nudgeCount/lastNudgedAt, which the list renders
// as a "1st/2nd reminder" chip, and supersedes any still-pending queued
// email for the same person so nobody gets two letters in one drip.
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

  const targets = await prisma.attendee.findMany({
    where: {
      ...WHERE,
      ...(ids && ids.length ? { id: { in: ids } } : { nudgeCount: 0 }),
    },
    orderBy: { createdAt: "asc" },
  });
  const skipped = ids && ids.length ? ids.length - targets.length : 0;
  if (!targets.length) return NextResponse.json({ queued: 0, skipped });

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

  return NextResponse.json({ queued, skipped });
}
