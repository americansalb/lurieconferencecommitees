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
// bucket, so the count here agrees with the Registering chip on the list.
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
  const count = await prisma.attendee.count({ where: WHERE });
  return NextResponse.json({ count });
}

// Queue the finish-registration nudge for everyone who started but didn't
// pay. Paced through the shared email queue like every other bulk touch, and
// any still-pending row for the same person is superseded so nobody gets two
// letters in one drip.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;

  const targets = await prisma.attendee.findMany({
    where: WHERE,
    orderBy: { createdAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ queued: 0 });

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
    await prisma.attendeeEvent.create({
      data: { attendeeId: a.id, type: "finish_nudge_queued", actorEmail: adminEmail },
    }).catch(() => {});
    queued++;
  }

  return NextResponse.json({ queued });
}
