import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAttendeeInvite } from "@/lib/attendees";
import { ensureFirstNameCode, ensureCampaignCode, CMI_SHARED_CODE } from "@/lib/discounts";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

// "We invited them, they opened nothing / haven't paid": the people worth a
// second touch. Excludes paid attendees, organic self-registrations, declines,
// and the still-queued (those just haven't gone out the first time yet).
const RESENDABLE = ["invited", "viewed", "rsvp_pending"];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ?templates=student,former-student narrows the count to those segments.
  const tpl = new URL(req.url).searchParams.get("templates");
  const templates = tpl ? tpl.split(",").map((s) => s.trim()).filter(Boolean) : null;
  const count = await prisma.attendee.count({
    where: {
      paid: false,
      isTest: false,
      unsubscribedAt: null,
      status: { in: RESENDABLE },
      ...(templates && templates.length ? { inviteTemplate: { in: templates } } : {}),
    },
  });
  return NextResponse.json({ count });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;

  // Optional segment filter, e.g. { templates: ["student", "former-student"] }
  // to re-touch only the students with the reworked letter and leave alumni
  // (or the 2024 reunion batch) alone.
  const body = await req.json().catch(() => ({} as { templates?: unknown }));
  const templates = Array.isArray((body as { templates?: unknown }).templates)
    ? ((body as { templates: unknown[] }).templates.filter((t): t is string => typeof t === "string"))
    : null;

  const targets = await prisma.attendee.findMany({
    where: {
      paid: false,
      isTest: false,
      unsubscribedAt: null,
      status: { in: RESENDABLE },
      ...(templates && templates.length ? { inviteTemplate: { in: templates } } : {}),
    },
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
    // The NBCMI cohort's note also advertises the shared campaign code.
    if (a.inviteTemplate === "cmi") await ensureCampaignCode(CMI_SHARED_CODE, a.discountPercent, "NBCMI registry outreach (auto-created)", adminEmail).catch(() => {});
    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
      returning: { status: a.returning2024, mode: a.attended2024Mode, languages: a.primaryLanguages },
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
