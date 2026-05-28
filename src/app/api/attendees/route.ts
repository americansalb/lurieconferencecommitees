import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newAttendeeToken, parseAttendeeCsv, attendeeFunnelUrl, PRICING, attendeeFromHeader, attendeeReplyTo } from "@/lib/attendees";
import { attendeeInviteEmail } from "@/lib/mail-templates";
import { getPolicy, planSendTimes } from "@/lib/email-queue";
import { sendMail } from "@/lib/mail";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invitedById = (session?.user as { id?: string })?.id;
  const adminEmail = session?.user?.email || null;

  const payload = await req.json();
  const { single, csv, inviteMessage, discountPercent } = payload;
  const pct = Math.max(0, Math.min(100, Number.isFinite(discountPercent) ? discountPercent : 25));

  // Single-recipient mode: send immediately, bypass the queue.
  if (single && typeof single === "object") {
    const firstName = String(single.firstName || "").trim();
    const lastName = String(single.lastName || "").trim();
    const email = String(single.email || "").trim().toLowerCase();
    const affiliation = single.affiliation ? String(single.affiliation).trim() : null;
    const notes = single.notes ? String(single.notes).trim() : null;
    if (!firstName || !lastName || !isEmail(email)) {
      return NextResponse.json({ error: "First name, last name, and a valid email are required" }, { status: 400 });
    }
    const existing = await prisma.attendee.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: `${email} is already on the list` }, { status: 409 });
    }

    const token = newAttendeeToken();
    const attendee = await prisma.attendee.create({
      data: {
        email,
        firstName,
        lastName,
        affiliation,
        notes,
        discountPercent: pct,
        inviteToken: token,
        inviteMessage: inviteMessage?.trim() || null,
        invitedById: invitedById || null,
        status: "queued",
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "added_to_queue", actorEmail: adminEmail },
    });

    const url = attendeeFunnelUrl(token);
    const baseCents = PRICING.inPerson.standardCents;
    const finalCents = Math.round(baseCents * (100 - pct) / 100);
    const html = attendeeInviteEmail({
      firstName,
      url,
      inviteMessage: inviteMessage?.trim() || null,
      discountPercent: pct,
      inPersonOriginalCents: baseCents,
      inPersonDiscountedCents: finalCents,
    });
    const subject = `${firstName}, your invite to the 2026 Lurie Children's & AALB Conference`;

    try {
      await sendMail({
        to: email,
        subject,
        html,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
      });
      await prisma.attendee.update({
        where: { id: attendee.id },
        data: { status: "invited", invitedAt: new Date(), lastSentAt: new Date() },
      });
      await prisma.attendeeEvent.create({
        data: { attendeeId: attendee.id, type: "invite_sent_immediate", actorEmail: adminEmail },
      });
      return NextResponse.json({ ok: true, mode: "immediate", attendeeId: attendee.id, sent: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.attendeeEvent.create({
        data: { attendeeId: attendee.id, type: "invite_send_failed", meta: msg.slice(0, 300), actorEmail: adminEmail },
      });
      return NextResponse.json(
        { ok: false, mode: "immediate", attendeeId: attendee.id, sent: false, error: msg },
        { status: 502 }
      );
    }
  }

  // Bulk paste-CSV mode: queue with pacing.
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "Pass `single` for a one-off invite or `csv` for a bulk list." }, { status: 400 });
  }

  const { rows, errors } = parseAttendeeCsv(csv);
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

  if (created.length) {
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
    mode: "bulk",
    created: created.length,
    skipped,
    parseErrors: errors,
  });
}

