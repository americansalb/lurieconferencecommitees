import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { attendeeFunnelUrl, PRICING, attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";
import { attendeeInviteEmail } from "@/lib/mail-templates";
import { sendMail } from "@/lib/mail";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;

  const attendee = await prisma.attendee.findUnique({ where: { id: params.id } });
  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = attendeeFunnelUrl(attendee.inviteToken);
  const baseCents = PRICING.inPerson.standardCents;
  const finalCents = Math.round(baseCents * (100 - attendee.discountPercent) / 100);
  const html = attendeeInviteEmail({
    firstName: attendee.firstName,
    url,
    inviteMessage: attendee.inviteMessage,
    discountPercent: attendee.discountPercent,
    inPersonOriginalCents: baseCents,
    inPersonDiscountedCents: finalCents,
  });

  try {
    await sendMail({
      to: attendee.email,
      subject: `${attendee.firstName}, your invite to the 2026 Lurie Children's & AALB Conference`,
      html,
      from: attendeeFromHeader(),
      replyTo: attendeeReplyTo(),
    });
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
