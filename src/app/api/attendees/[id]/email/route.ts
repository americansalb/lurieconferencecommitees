import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAttendeeInvite } from "@/lib/attendees";

// Returns the exact email this attendee was sent (the queued/archived copy),
// or, if none is stored (e.g. nothing sent yet), a faithful re-render from
// their current data, clearly flagged as a regenerated preview.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attendee = await prisma.attendee.findUnique({ where: { id: params.id } });
  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.emailQueue.findFirst({
    where: { recipientType: "attendee", recipientId: attendee.id },
    orderBy: { createdAt: "desc" },
  });
  if (row) {
    return NextResponse.json({
      source: "sent", to: row.to, subject: row.subject, html: row.html,
      status: row.status, sentAt: row.sentAt, scheduledFor: row.scheduledFor,
    });
  }

  const { subject, html } = buildAttendeeInvite({
    firstName: attendee.firstName, inviteToken: attendee.inviteToken,
    discountPercent: attendee.discountPercent, inviteMessage: attendee.inviteMessage,
    template: attendee.inviteTemplate,
    returning: { status: attendee.returning2024, mode: attendee.attended2024Mode, languages: attendee.primaryLanguages },
  });
  return NextResponse.json({ source: "rendered", to: attendee.email, subject, html, status: attendee.status, sentAt: null, scheduledFor: null });
}
