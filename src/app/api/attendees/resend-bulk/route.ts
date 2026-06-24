import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAttendeeInvite } from "@/lib/attendees";
import { ensureFirstNameCode } from "@/lib/discounts";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// "We invited them, they opened nothing / haven't paid": the people worth a
// second touch. Excludes paid attendees, organic self-registrations, declines,
// and the still-queued (those just haven't gone out the first time yet).
const RESENDABLE = ["invited", "viewed", "rsvp_pending"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const count = await prisma.attendee.count({
    where: { paid: false, status: { in: RESENDABLE } },
  });
  return NextResponse.json({ count });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;

  const targets = await prisma.attendee.findMany({
    where: { paid: false, status: { in: RESENDABLE } },
    orderBy: { invitedAt: "asc" },
  });
  if (!targets.length) return NextResponse.json({ queued: 0 });

  // Re-queue paced rather than blast: we just took a deliverability hit from the
  // phantom BCC, so the gentlest way back in is to drip these through the same
  // hourly/daily caps a fresh bulk invite uses. The admin can still hit
  // "Send queue now" if they want them out immediately.
  const policy = await getPolicy();
  const times = await planSendTimes(targets.length, policy);
  const batchId = `attendee-reinvite-${Date.now()}`;

  let queued = 0;
  for (let i = 0; i < targets.length; i++) {
    const a = targets[i];
    // Supersede any still-pending paced send so we never double up.
    await prisma.emailQueue.updateMany({
      where: { recipientType: "attendee", recipientId: a.id, status: "pending" },
      data: { status: "cancelled" },
    }).catch(() => {});
    await ensureFirstNameCode(a.firstName, a.discountPercent, adminEmail).catch(() => {});
    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
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
      data: { attendeeId: a.id, type: "reinvite_queued", actorEmail: adminEmail },
    }).catch(() => {});
    queued++;
  }

  return NextResponse.json({ queued });
}
