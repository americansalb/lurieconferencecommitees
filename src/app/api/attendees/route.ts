import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newAttendeeToken, parseAttendeeCsv, parseEmailList, nameFromEmail, attendeeFromHeader, attendeeReplyTo, attendeeBcc, attendeeUnsubHeaders, buildAttendeeInvite, programAttachments, attachmentsJsonFor } from "@/lib/attendees";
import { pickAlumniSubject, pickStudentSubject, pickCmiSubject } from "@/lib/subject-variants";
import { ensureFirstNameCode } from "@/lib/discounts";
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

  const rows = await prisma.attendee.findMany({
    where: { isTest: false },
    orderBy: { createdAt: "desc" },
    // The partner they're attending under, so the list can show who is here
    // on a sponsor's table rather than as an individual registration.
    include: { sponsor: { select: { id: true, companyName: true } } },
  });
  // Attach the A/B subject variant (derived from the token) so the dashboard
  // can report click rate per subject line. Alumni and students draw from
  // different variant sets.
  const attendees = rows.map((a) => ({
    ...a,
    subjectVariant:
      a.inviteTemplate === "alumni"
        ? pickAlumniSubject("", a.inviteToken).id
        : a.inviteTemplate === "student" || a.inviteTemplate === "former-student"
        ? pickStudentSubject("", a.inviteToken).id
        : a.inviteTemplate === "cmi"
        ? pickCmiSubject("", a.inviteToken).id
        : null,
  }));

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
  // Any of the four community/standard templates is valid; anything else falls
  // back to the plain standard invite. buildAttendeeInvite handles all four.
  const VALID_TEMPLATES = new Set(["standard", "alumni", "student", "former-student", "returning", "cmi", "chicago"]);
  const template = VALID_TEMPLATES.has(payload.template) ? String(payload.template) : "standard";

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
        inviteTemplate: template,
        invitedById: invitedById || null,
        status: "queued",
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: attendee.id, type: "added_to_queue", actorEmail: adminEmail },
    });
    // Make their personal first-name code redeemable on the public site too.
    await ensureFirstNameCode(firstName, pct, adminEmail).catch((e) => console.error("[attendees] ensure code failed", e));

    const { subject, html } = buildAttendeeInvite({
      firstName, inviteToken: token, discountPercent: pct,
      inviteMessage: inviteMessage?.trim() || null, template, org: affiliation,
    });

    try {
      await sendMail({
        to: email,
        subject,
        html,
        from: attendeeFromHeader(),
        replyTo: attendeeReplyTo(),
        bcc: attendeeBcc(),
        headers: attendeeUnsubHeaders(token),
        attachments: template === "cmi" ? programAttachments() : undefined,
      });
      // Archive the exact email so it can be viewed later from the dashboard.
      await prisma.emailQueue.create({
        data: { batchId: "attendee-immediate", recipientType: "attendee", recipientId: attendee.id, to: email, subject, html, attachments: attachmentsJsonFor(template), scheduledFor: new Date(), status: "sent", sentAt: new Date() },
      }).catch(() => {});
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

  // Emails-only mode: paste a list of addresses (comma / space / newline
  // separated) with no names, for a quick deliverability test. Sends each one
  // immediately so the seed mailboxes get it right away; capped so a giant
  // paste can't turn into a blast. Re-sending to an address already on the list
  // just resends to it, so you can test the same inbox repeatedly.
  if (typeof payload.emails === "string" && payload.emails.trim()) {
    if (!template) {
      return NextResponse.json({ error: "Choose a template (Standard or AALB alumni) before sending the test." }, { status: 400 });
    }
    const { emails, invalid } = parseEmailList(payload.emails);
    if (!emails.length) {
      return NextResponse.json({ error: "No valid email addresses found.", invalid }, { status: 400 });
    }
    const CAP = 25;
    const batch = emails.slice(0, CAP);
    const results: { email: string; sent: boolean; error?: string }[] = [];
    for (const email of batch) {
      const existing = await prisma.attendee.findUnique({ where: { email } });
      let att = existing;
      if (!att) {
        const { firstName, lastName } = nameFromEmail(email);
        const token = newAttendeeToken();
        // isTest keeps these out of the pipeline and metrics; skip the
        // first-name discount code so the codes table isn't polluted either.
        att = await prisma.attendee.create({
          data: {
            email, firstName, lastName,
            discountPercent: pct,
            inviteToken: token,
            inviteMessage: inviteMessage?.trim() || null,
            inviteTemplate: template,
            invitedById: invitedById || null,
            status: "queued",
            isTest: true,
          },
        });
        await prisma.attendeeEvent.create({ data: { attendeeId: att.id, type: "added_to_queue", meta: "delivery test", actorEmail: adminEmail } }).catch(() => {});
      }
      const { subject, html } = buildAttendeeInvite({
        firstName: att.firstName, inviteToken: att.inviteToken, discountPercent: pct,
        inviteMessage: inviteMessage?.trim() || null, template,
      });
      try {
        await sendMail({ to: email, subject, html, from: attendeeFromHeader(), replyTo: attendeeReplyTo(), bcc: attendeeBcc(), headers: attendeeUnsubHeaders(att.inviteToken), attachments: template === "cmi" ? programAttachments() : undefined });
        // Tagged recipientType "test" so it lands under the Test bucket in the
        // queue and analytics, never mixed into attendee numbers.
        await prisma.emailQueue.create({
          data: { batchId: "attendee-delivery-test", recipientType: "test", recipientId: att.id, to: email, subject, html, scheduledFor: new Date(), status: "sent", sentAt: new Date() },
        }).catch(() => {});
        await prisma.attendee.update({
          where: { id: att.id },
          data: { status: att.status === "queued" ? "invited" : att.status, invitedAt: att.invitedAt ?? new Date(), lastSentAt: new Date() },
        });
        await prisma.attendeeEvent.create({ data: { attendeeId: att.id, type: "invite_sent_immediate", meta: "delivery test", actorEmail: adminEmail } }).catch(() => {});
        results.push({ email, sent: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await prisma.attendeeEvent.create({ data: { attendeeId: att.id, type: "invite_send_failed", meta: msg.slice(0, 300), actorEmail: adminEmail } }).catch(() => {});
        results.push({ email, sent: false, error: msg });
      }
    }
    const sent = results.filter((r) => r.sent).length;
    return NextResponse.json({
      mode: "emails",
      sent,
      failed: results.length - sent,
      results,
      invalid,
      skippedOverCap: emails.length > CAP ? emails.length - CAP : 0,
    });
  }

  // Draft-load mode: bulk-insert a big roster as "queued" (on the list, NOT
  // emailed) with NO emails scheduled. Powers the one-click "Load AALB students"
  // button, which posts the ~2,900-row baked-in roster. Uses createMany in
  // batches so it can't time out, and each row keeps its own template
  // (alumni/student/former-student) and cohort. Re-loading is safe: existing
  // emails are skipped. We deliberately skip the per-row first-name discount
  // codes here (too slow at this scale, and not needed until send) — the 25%
  // still applies through each person's invite link, and codes get ensured when
  // the invite is actually built to send.
  if (payload.draftOnly && typeof csv === "string" && csv.trim()) {
    const { rows, errors } = parseAttendeeCsv(csv);
    if (!rows.length) {
      return NextResponse.json({ mode: "draft", created: 0, skipped: 0, parseErrors: errors }, { status: 400 });
    }
    // Dedupe against the file itself and against everyone already on the list,
    // in one query, so the "skipped" count is accurate. createMany's
    // skipDuplicates is the backstop against a race.
    const wantEmails = Array.from(new Set(rows.map((r) => r.email)));
    const existing = await prisma.attendee.findMany({
      where: { email: { in: wantEmails } },
      select: { email: true },
    });
    const have = new Set(existing.map((e: { email: string }) => e.email));
    const seen = new Set<string>();
    const fresh = rows.filter((r) => {
      if (have.has(r.email) || seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    let created = 0;
    const BATCH = 500;
    for (let i = 0; i < fresh.length; i += BATCH) {
      const chunk = fresh.slice(i, i + BATCH);
      const res = await prisma.attendee.createMany({
        data: chunk.map((r) => ({
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          affiliation: r.affiliation || null,
          notes: r.notes || null,
          cohort: r.cohort || null,
          cohortOrder: r.cohortOrder ?? null,
          discountPercent: pct,
          inviteToken: newAttendeeToken(),
          inviteMessage: inviteMessage?.trim() || null,
          // Each row's own template wins so one load carries all three framings.
          inviteTemplate: r.template || template,
          invitedById: invitedById || null,
          status: "queued",
        })),
        skipDuplicates: true,
      });
      created += res.count;
    }

    return NextResponse.json({
      mode: "draft",
      created,
      skipped: rows.length - fresh.length,
      parseErrors: errors,
    });
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
        cohort: r.cohort || null,
        cohortOrder: r.cohortOrder ?? null,
        discountPercent: pct,
        inviteToken: token,
        inviteMessage: inviteMessage?.trim() || null,
        // A row's own template (alumni/student/former-student) wins, so one
        // paste can carry all three; otherwise the batch-level template applies.
        inviteTemplate: r.template || template,
        invitedById: invitedById || null,
        status: "queued",
      },
    });
    await prisma.attendeeEvent.create({
      data: { attendeeId: a.id, type: "added_to_queue", actorEmail: adminEmail },
    });
    await ensureFirstNameCode(a.firstName, pct, adminEmail).catch((e) => console.error("[attendees] ensure code failed", e));
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
      const { subject, html } = buildAttendeeInvite({
        firstName: attendee.firstName, inviteToken: att.token, discountPercent: pct,
        inviteMessage: inviteMessage?.trim() || null,
        // The row's own template, not the batch default: a paste can carry a
        // per-row Template column (inviteTemplate above is `r.template ||
        // template`), and rendering the batch default here would have queued
        // the wrong letter for those rows.
        template: attendee.inviteTemplate, org: attendee.affiliation,
      });
      await prisma.emailQueue.create({
        data: {
          batchId,
          recipientType: "attendee",
          recipientId: att.id,
          to: att.email,
          subject,
          html,
          attachments: attachmentsJsonFor(attendee.inviteTemplate),
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

