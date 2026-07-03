import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAttendeeInvite } from "@/lib/attendees";
import { ensureFirstNameCode } from "@/lib/discounts";

// Per-person "Queue invite" for an attendee: schedule the invitation into the
// shared paced Email Queue (the only path that delivers). Supersedes any copy
// already queued for this person so we never double-send.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminEmail = session?.user?.email || null;

  const attendee = await prisma.attendee.findUnique({ where: { id: params.id } });
  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attendee.unsubscribedAt) {
    return NextResponse.json({ ok: false, error: "This person has unsubscribed." }, { status: 409 });
  }

  await ensureFirstNameCode(attendee.firstName, attendee.discountPercent, adminEmail).catch((e) => console.error("[attendees] ensure code failed", e));

  const { subject, html } = buildAttendeeInvite({
    firstName: attendee.firstName,
    inviteToken: attendee.inviteToken,
    discountPercent: attendee.discountPercent,
    inviteMessage: attendee.inviteMessage,
    template: attendee.inviteTemplate,
  });

  try {
    // Supersede any still-pending paced copy so the cron doesn't also send it.
    await prisma.emailQueue.updateMany({
      where: { recipientType: "attendee", recipientId: attendee.id, status: "pending" },
      data: { status: "canceled" },
    }).catch(() => {});
    await prisma.emailQueue.create({
      data: { batchId: "attendee-resend", recipientType: "attendee", recipientId: attendee.id, to: attendee.email, subject, html, scheduledFor: new Date(), status: "pending" },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "invite_requeued", actorEmail: adminEmail },
    });
    return NextResponse.json({ ok: true, queued: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
