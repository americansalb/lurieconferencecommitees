import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CHICAGO_TARGETS, loadableChicagoTargets } from "@/lib/chicago-targets";
import { newAttendeeToken, buildAttendeeInvite } from "@/lib/attendees";
import { ensureFirstNameCode } from "@/lib/discounts";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

const BATCH_PREFIX = "attendee-chicago";

// The Chicago direct-invitation list: named leaders at Chicago-area
// organizations whose work is language access, each carrying a hand-written
// paragraph about their own organization (see lib/chicago-targets).
//
// GET
//   Counts for the dashboard card: how many people are curated, how many have
//   a published address and are therefore loadable, how many are already in
//   the pipeline, and how many have been written to.
//
// POST { action: "load", discountPercent? }
//   Creates the loadable rows as "queued" attendees on the "chicago"
//   template, with the org in `affiliation` (the letter's subject line and
//   footer read from it) and the hand-written paragraph in `inviteMessage`.
//   Rows without a published address are skipped, not invented.
//
// POST { action: "queue" }
//   Renders each person's letter and drips them into the shared paced Email
//   Queue. Never double-queues, and never writes to anyone who has already
//   been sent something.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const loadable = loadableChicagoTargets();
  const emails = loadable.map((t) => t.email.trim().toLowerCase());
  const rows = emails.length
    ? await prisma.attendee.findMany({
        where: { email: { in: emails } },
        select: { id: true, lastSentAt: true, paid: true },
      })
    : [];
  const pending = emails.length
    ? await prisma.emailQueue.count({
        where: { recipientType: "attendee", status: "pending", recipientId: { in: rows.map((r) => r.id) } },
      })
    : 0;
  return NextResponse.json({
    ok: true,
    curated: CHICAGO_TARGETS.length,
    loadable: loadable.length,
    // Researched real people we could not find a public address for. They are
    // kept in the file as leads; surfacing the number keeps the gap honest
    // rather than making the list look complete.
    missingEmail: CHICAGO_TARGETS.filter((t) => !t.email.trim()).length,
    // People whose address we DO have and are choosing not to use, almost
    // always because a colleague at the same small team is already getting a
    // letter. Counted separately from missingEmail so the two never get
    // confused: one is a research gap, the other is a judgement call.
    held: CHICAGO_TARGETS.filter((t) => t.hold && t.email.trim()).length,
    inPipeline: rows.length,
    contacted: rows.filter((r) => r.lastSentAt).length,
    paid: rows.filter((r) => r.paid).length,
    pending,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session?.user?.email || null;
  const body = await req.json().catch(() => ({}));
  const action = body?.action === "queue" ? "queue" : "load";

  if (action === "load") {
    const pct = Math.max(0, Math.min(100, Number.isFinite(body?.discountPercent) ? body.discountPercent : 25));
    let created = 0;
    let retagged = 0;
    let leftAlone = 0;
    for (const t of loadableChicagoTargets()) {
      const email = t.email.trim().toLowerCase();
      // Title and provenance ride along in adminNotes so anyone auditing a row
      // on the dashboard can see who this person is and where we found them.
      const provenance = [t.title, t.source].filter(Boolean).join(" — ");
      const existing = await prisma.attendee.findUnique({ where: { email } });
      if (!existing) {
        const a = await prisma.attendee.create({
          data: {
            email,
            firstName: t.firstName,
            lastName: t.lastName,
            affiliation: t.org,
            adminNotes: provenance || null,
            inviteMessage: t.note,
            discountPercent: pct,
            inviteToken: newAttendeeToken(),
            inviteTemplate: "chicago",
            status: "queued",
          },
        });
        await prisma.attendeeEvent
          .create({ data: { attendeeId: a.id, type: "added_to_queue", meta: `Chicago list — ${t.org}`, actorEmail: adminEmail } })
          .catch(() => {});
        created++;
        continue;
      }
      // Someone already on the list. Never touch people who paid, said no, or
      // opted out — and, unlike the roster loaders, never re-frame anyone we
      // have ALREADY written to. Receiving a second cold invitation with a
      // different opening is precisely what gives an outreach program away.
      if (existing.paid || existing.status === "declined" || existing.unsubscribedAt || existing.isTest || existing.lastSentAt) {
        leftAlone++;
        continue;
      }
      await prisma.attendee.update({
        where: { id: existing.id },
        data: {
          inviteTemplate: "chicago",
          affiliation: existing.affiliation || t.org,
          inviteMessage: t.note,
          adminNotes: existing.adminNotes || provenance || null,
        },
      });
      retagged++;
    }
    return NextResponse.json({ ok: true, created, retagged, leftAlone, total: loadableChicagoTargets().length });
  }

  // action === "queue": drip each person's letter into the paced queue.
  //
  // The response reports where every Chicago person stands, in separate
  // numbers. It used to return one `skipped` count that the dashboard printed
  // as "already queued or not eligible", which reads like a rejection — and it
  // never was one. Anyone ineligible is filtered out by the query below and so
  // can't be in that number at all; it could only ever mean "already waiting
  // in the queue", which is the harmless case. Counting them apart keeps a
  // successful no-op from looking like a failure.
  const cohort = await prisma.attendee.count({ where: { inviteTemplate: "chicago" } });
  const writtenTo = await prisma.attendee.count({ where: { inviteTemplate: "chicago", lastSentAt: { not: null } } });

  const targets = await prisma.attendee.findMany({
    where: {
      inviteTemplate: "chicago",
      paid: false,
      isTest: false,
      unsubscribedAt: null,
      lastSentAt: null,
      status: { notIn: ["declined", "registered", "rsvp_pending", "confirmed"] },
    },
  });
  // Everyone on the template minus everyone still writable: people who have
  // been written to already, paid, declined, or opted out.
  const notEligible = Math.max(0, cohort - targets.length);
  const summary = { cohort, writtenTo, notEligible };
  if (!targets.length) return NextResponse.json({ ok: true, queued: 0, alreadyQueued: 0, ...summary });

  const already = await prisma.emailQueue.findMany({
    where: { recipientType: "attendee", status: "pending", recipientId: { in: targets.map((t) => t.id) } },
    select: { recipientId: true },
  });
  const has = new Set(already.map((r) => r.recipientId));
  const fresh = targets.filter((t) => !has.has(t.id));
  if (!fresh.length) return NextResponse.json({ ok: true, queued: 0, alreadyQueued: targets.length, ...summary });

  // Their first name also works as a discount code on the public site, so the
  // letter's link and the main site agree if they navigate there themselves.
  const seenNames = new Set<string>();
  for (const t of fresh) {
    const key = (t.firstName || "").toLowerCase();
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    await ensureFirstNameCode(t.firstName, t.discountPercent, adminEmail).catch(() => {});
  }

  const policy = await getPolicy();
  const times = await planSendTimes(fresh.length, policy);
  const batchId = `${BATCH_PREFIX}-${Date.now()}`;
  const rows = fresh.map((a, i) => {
    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
      org: a.affiliation,
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
    .createMany({ data: fresh.map((a) => ({ attendeeId: a.id, type: "added_to_send_queue", meta: "Chicago list", actorEmail: adminEmail })) })
    .catch(() => {});

  return NextResponse.json({ ok: true, queued, alreadyQueued: targets.length - fresh.length, ...summary, batchId });
}
