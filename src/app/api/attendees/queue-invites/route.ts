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

// Schedule invites for not-yet-emailed ("queued") attendees into the shared
// paced Email Queue — the safe way to actually start inviting a loaded roster.
// Takes a selection of ids (or every queued attendee when none is given), skips
// anyone already emailed / paid / unsubscribed / test / already in the queue,
// renders each person's invite, and drips them out via planSendTimes. It NEVER
// sends immediately, so there's no way to blast a whole roster at once.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : null;

  // Only ever the not-yet-emailed, real, opted-in people.
  const targets = await prisma.attendee.findMany({
    where: {
      status: "queued",
      paid: false,
      isTest: false,
      unsubscribedAt: null,
      ...(ids && ids.length ? { id: { in: ids } } : {}),
    },
  });
  if (!targets.length) return NextResponse.json({ ok: true, queued: 0, skipped: 0 });

  // Don't double-queue anyone who already has a pending row.
  const already = await prisma.emailQueue.findMany({
    where: { recipientType: "attendee", status: "pending", recipientId: { in: targets.map((t) => t.id) } },
    select: { recipientId: true },
  });
  const has = new Set(already.map((r) => r.recipientId));
  const fresh = targets.filter((t) => !has.has(t.id));
  if (!fresh.length) return NextResponse.json({ ok: true, queued: 0, skipped: targets.length });

  // Ensure a redeemable first-name discount code exists (deduped by name to stay
  // fast at roster scale) so the invite's discount also works on the public site.
  const seenNames = new Set<string>();
  for (const t of fresh) {
    const key = (t.firstName || "").toLowerCase();
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    await ensureFirstNameCode(t.firstName, t.discountPercent, adminEmail).catch(() => {});
  }

  const policy = await getPolicy();
  const times = await planSendTimes(fresh.length, policy);
  const batchId = `attendee-queue-${Date.now()}`;
  const rows = fresh.map((a, i) => {
    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
      returning: { status: a.returning2024, mode: a.attended2024Mode, languages: a.primaryLanguages },
    });
    return {
      batchId,
      recipientType: "attendee" as const,
      recipientId: a.id,
      to: a.email,
      subject,
      html,
      scheduledFor: times[i],
      status: "pending" as const,
    };
  });

  let queued = 0;
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await prisma.emailQueue.createMany({ data: rows.slice(i, i + BATCH) });
    queued += res.count;
  }
  await prisma.attendeeEvent
    .createMany({ data: fresh.map((a) => ({ attendeeId: a.id, type: "added_to_send_queue", actorEmail: adminEmail })) })
    .catch(() => {});

  return NextResponse.json({ ok: true, queued, skipped: targets.length - fresh.length });
}
