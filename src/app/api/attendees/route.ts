import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newAttendeeToken, parseAttendeeCsv, attendeeFunnelUrl, PRICING } from "@/lib/attendees";
import { attendeeInviteEmail } from "@/lib/mail-templates";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendees = await prisma.attendee.findMany({
    orderBy: { createdAt: "desc" },
  });

  const queueCounts = await prisma.emailQueue.groupBy({
    by: ["status"],
    where: { recipientType: "attendee" },
    _count: { _all: true },
  });
  const queue = queueCounts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = c._count._all;
    return acc;
  }, {});

  return NextResponse.json({ attendees, queue });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const invitedById = (session?.user as { id?: string })?.id;
  const adminEmail = session?.user?.email || null;

  const { csv, inviteMessage, discountPercent, sendNow } = await req.json();
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "csv string required" }, { status: 400 });
  }

  const { rows, errors } = parseAttendeeCsv(csv);
  const pct = Math.max(0, Math.min(100, Number.isFinite(discountPercent) ? discountPercent : 25));

  const created: { id: string; email: string; token: string }[] = [];
  const skipped: { email: string; reason: string }[] = [];

  for (const r of rows) {
    const existing = await prisma.attendee.findUnique({ where: { email: r.email } });
    if (existing) {
      skipped.push({ email: r.email, reason: "already invited" });
      continue;
    }
    const token = newAttendeeToken();
    const a = await prisma.attendee.create({
      data: {
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        affiliation: r.affiliation || null,
        notes: r.notes || null,
        discountPercent: pct,
        inviteToken: token,
        inviteMessage: inviteMessage?.trim() || null,
        invitedById: invitedById || null,
        status: "queued",
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: a.id, type: "added_to_queue", actorEmail: adminEmail },
    });
    created.push({ id: a.id, email: a.email, token });
  }

  // Schedule the invite emails with jittered, business-hours pacing.
  if (created.length && sendNow !== false) {
    const policy = await getPolicy();
    const times = await planSendTimes(created.length, policy);
    const batchId = `attendee-invite-${Date.now()}`;

    for (let i = 0; i < created.length; i++) {
      const att = created[i];
      const attendee = await prisma.attendee.findUnique({ where: { id: att.id } });
      if (!attendee) continue;
      const url = attendeeFunnelUrl(att.token);
      const baseCents = PRICING.inPerson.standardCents;
      const finalCents = Math.round(baseCents * (100 - pct) / 100);
      const html = attendeeInviteEmail({
        firstName: attendee.firstName,
        url,
        inviteMessage: inviteMessage?.trim() || null,
        discountPercent: pct,
        inPersonOriginalCents: baseCents,
        inPersonDiscountedCents: finalCents,
      });
      await prisma.emailQueue.create({
        data: {
          batchId,
          recipientType: "attendee",
          recipientId: att.id,
          to: att.email,
          subject: `${attendee.firstName}, your invite to the 2026 Lurie Children's & AALB Conference`,
          html,
          scheduledFor: times[i],
          status: "pending",
        },
      });
    }
  }

  return NextResponse.json({
    created: created.length,
    skipped,
    parseErrors: errors,
  });
}
