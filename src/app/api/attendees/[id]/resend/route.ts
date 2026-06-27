import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { attendeeFromHeader, attendeeReplyTo, attendeeBcc, attendeeUnsubHeaders, buildAttendeeInvite } from "@/lib/attendees";
import { ensureFirstNameCode } from "@/lib/discounts";
import { sendMail } from "@/lib/mail";

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
    await sendMail({
      to: attendee.email,
      subject,
      html,
      from: attendeeFromHeader(),
      replyTo: attendeeReplyTo(),
      bcc: attendeeBcc(),
      headers: attendeeUnsubHeaders(attendee.inviteToken),
    });
    await prisma.emailQueue.create({
      data: { batchId: "attendee-resend", recipientType: "attendee", recipientId: attendee.id, to: attendee.email, subject, html, scheduledFor: new Date(), status: "sent", sentAt: new Date() },
    }).catch(() => {});
    // Drop any still-pending paced send for this person so the cron doesn't
    // also deliver it: sending now supersedes the queued copy.
    await prisma.emailQueue.updateMany({
      where: { recipientType: "attendee", recipientId: attendee.id, status: "pending" },
      data: { status: "cancelled" },
    }).catch(() => {});
    await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        status: attendee.status === "queued" ? "invited" : attendee.status,
        invitedAt: attendee.invitedAt || new Date(),
        lastSentAt: new Date(),
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "invite_resent", actorEmail: adminEmail },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
