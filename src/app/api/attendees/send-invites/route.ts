import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildAttendeeInvite,
  programAttachments,
  attendeeFromHeader,
  attendeeReplyTo,
  attendeeBcc,
  attendeeUnsubHeaders,
} from "@/lib/attendees";
import { ensureFirstNameCode, ensureCampaignCode, CMI_SHARED_CODE, ensureStandingCampaignCodes } from "@/lib/discounts";
import { sendMail } from "@/lib/mail";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// Same ceiling as the finish-registration nudge and the one-off composer: a
// hand-picked selection goes out immediately, but never more than this many
// mailboxes in one click. This is the deliverability guard — it is the reason
// there is still no way to put a whole roster on the wire in one action.
const MAX_IMMEDIATE = 100;

// Send invites to a hand-picked selection RIGHT NOW, skipping the paced queue.
//
// The queue exists because a cold roster leaving all at once is what gets a
// domain filed as bulk mail. But a selection you have picked by hand off the
// list is a different thing from "send the roster", and having to queue five
// people and then wait for a cron is friction with no safety value. So this
// route mirrors /queue-invites exactly on WHO is eligible, and mirrors
// /nudge-unpaid on HOW delivery works, capped at MAX_IMMEDIATE per click.
//
// Anyone selected who is already emailed, paid, unsubscribed or a test row is
// skipped and reported, not silently dropped.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;
  await ensureStandingCampaignCodes().catch(() => {});

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : null;
  if (!ids || !ids.length) {
    return NextResponse.json(
      { error: "Pass the ids to send. This route only ever sends a hand-picked selection." },
      { status: 400 },
    );
  }

  // Identical eligibility to the paced path: only the not-yet-emailed, real,
  // opted-in people. Ordered so the cap takes the oldest first rather than an
  // arbitrary slice of the selection.
  const targets = await prisma.attendee.findMany({
    where: {
      status: "queued",
      paid: false,
      isTest: false,
      unsubscribedAt: null,
      id: { in: ids },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_IMMEDIATE,
  });

  const eligible = await prisma.attendee.count({
    where: { status: "queued", paid: false, isTest: false, unsubscribedAt: null, id: { in: ids } },
  });
  // Selected but not eligible (already written to, paid, opted out, test).
  const skipped = ids.length - eligible;
  // Eligible but over the per-click ceiling: still waiting, not lost.
  const overCap = Math.max(0, eligible - targets.length);

  if (!targets.length) return NextResponse.json({ ok: true, sent: 0, failed: 0, skipped, overCap });

  // Same discount-code guarantee as the queue path, deduped by first name so
  // this stays fast at roster scale.
  const seenNames = new Set<string>();
  for (const t of targets) {
    const key = (t.firstName || "").toLowerCase();
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    await ensureFirstNameCode(t.firstName, t.discountPercent, adminEmail).catch(() => {});
    if (t.inviteTemplate === "cmi") {
      await ensureCampaignCode(CMI_SHARED_CODE, t.discountPercent, "NBCMI registry outreach (auto-created)", adminEmail).catch(() => {});
    }
  }

  let sent = 0;
  let failed = 0;
  for (const a of targets) {
    // Supersede any still-pending paced row for this person, so sending now
    // does not also mail them again when the cron reaches their slot.
    await prisma.emailQueue.updateMany({
      where: { recipientType: "attendee", recipientId: a.id, status: "pending" },
      data: { status: "canceled" },
    }).catch(() => {});

    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
      org: a.affiliation,
      returning: { status: a.returning2024, mode: a.attended2024Mode, languages: a.primaryLanguages },
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
        // NBCMI letters carry the official program PDF, same as the queue path.
        attachments: a.inviteTemplate === "cmi" ? programAttachments() : undefined,
      });
      // Mirrors afterQueueSend() for attendees, so a letter sent from here
      // leaves the same trail as one the cron sent.
      await prisma.attendee.update({
        where: { id: a.id },
        data: { status: "invited", invitedAt: new Date(), lastSentAt: new Date() },
      }).catch(() => {});
      await prisma.attendeeEvent.create({
        data: { attendeeId: a.id, type: "invite_sent", actorEmail: adminEmail },
      }).catch(() => {});
      sent++;
    } catch (e) {
      console.error("[send-invites] immediate send failed", a.email, e);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, skipped, overCap });
}
