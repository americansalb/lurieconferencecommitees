import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { newSponsorToken, tierById, sponsorFromHeader, sponsorReplyTo, sponsorLetterReplyTo, sponsorInviteSubject, sponsorFoodSubject, sponsorAslSubject, sponsorArrangedSubject, sponsorUnsubHeaders, sponsorUnsubscribeUrl, isOfficialPartner, sponsorFirstName } from "@/lib/sponsors";
import { sponsorInviteEmail, sponsorLetterEmail, sponsorFoodLetterEmail, sponsorAslLetterEmail } from "@/lib/mail-templates";

// The formal letter is the standard sponsor invitation. Complimentary
// exhibitor tables (a free table, not a sponsorship) keep the dedicated
// "claim your table" email. The 20% VIP courtesy is never added here; it is
// applied only via the dedicated send-letter action.
function letterDate() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
import { appUrl } from "@/lib/presenters";
import { assertPublicBaseUrl } from "@/lib/sponsor-invite";
import { getPolicy, planSendTimes } from "@/lib/email-queue";
import { buildSponsorInviteRows } from "@/lib/imports";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// Invite a target sponsor: creates a Sponsor record with status="invited",
// emails a personalized invitation with a link to a landing page where they
// pick their own sponsorship level. Any authenticated team member can send.
// If a suggested tier is included it's stored as a hint; the invitee always
// has the final say on the landing page.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invitedById = (session.user as { id?: string }).id || null;
  const actorEmail = session.user.email || null;

  const body = await req.json();

  // Bulk mode: paste a list of prospects -> queued, paced invites. Mirrors the
  // attendee bulk queue and shares the same pacing policy + cron dispatcher.
  if (typeof body?.csv === "string" && body.csv.trim()) {
    return bulkInvite(body, invitedById, actorEmail);
  }

  const {
    companyName, contactName, contactEmail, contactPhone, contactRole, website,
    tier, inviteMessage, compExhibitor,
  } = body;

  if (!companyName?.trim() || !contactName?.trim() || !isEmail(contactEmail || "")) {
    return NextResponse.json(
      { error: "Company, contact name, and a valid email are required." },
      { status: 400 }
    );
  }

  // A complimentary exhibitor table is the exhibitor tier at $0. Otherwise the
  // tier is optional: "undecided" means the invitee picks on the landing page.
  const compTable = Boolean(compExhibitor);
  const partner = isOfficialPartner(companyName);
  const suggested = compTable ? null : (tier ? tierById(tier) : null);
  const tierId = compTable ? "exhibitor" : (suggested ? suggested.id : "undecided");
  const food = tierId === "food";
  const asl = tierId === "asl";
  const amountCents = compTable ? 0 : (suggested ? suggested.amountCents : 0);

  const email = contactEmail.trim().toLowerCase();
  // Dedupe on email alone: "Acme, Inc." vs "Acme Inc" is the same inbox, and
  // two records would mean two invitation threads (and an unsubscribe on one
  // that doesn't suppress the other).
  const existing = await prisma.sponsor.findFirst({
    where: { contactEmail: { equals: email, mode: "insensitive" }, mergedIntoId: null },
  });
  if (existing) {
    const sameCompany = existing.companyName.trim().toLowerCase() === companyName.trim().toLowerCase();
    return NextResponse.json(
      {
        error: sameCompany
          ? `${companyName} (${email}) already has a sponsorship record. Open it from the list.`
          : `${email} already belongs to the record for "${existing.companyName}". Open that record instead of creating a duplicate.`,
        sponsorId: existing.id,
      },
      { status: 409 }
    );
  }

  const token = newSponsorToken();
  const sponsor = await prisma.sponsor.create({
    data: {
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: email,
      contactPhone: contactPhone?.trim() || null,
      contactRole: contactRole?.trim() || null,
      website: website?.trim() || null,
      tier: tierId,
      amountCents,
      inviteMessage: inviteMessage?.trim() || null,
      invitedById,
      invitedAt: new Date(),
      lastSentAt: new Date(),
      applicationToken: token,
      status: "invited",
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "invite_sent", actorEmail, meta: tierId },
  });

  const landingUrl = `${appUrl()}/sponsor/invited/${token}`;
  let html: string;
  let subject: string;
  if (food) {
    html = sponsorFoodLetterEmail({
      contactName: sponsor.contactName,
      companyName: sponsor.companyName,
      note: sponsor.inviteMessage,
      pledgeUrl: `${appUrl()}/sponsor/food/${token}`,
      learnMoreUrl: appUrl(),
      unsubscribeUrl: sponsorUnsubscribeUrl(token),
      assetBase: appUrl(),
    });
    subject = sponsorFoodSubject(sponsor.companyName);
  } else if (asl) {
    html = sponsorAslLetterEmail({
      contactName: sponsor.contactName,
      companyName: sponsor.companyName,
      note: sponsor.inviteMessage,
      pledgeUrl: `${appUrl()}/sponsor/asl/${token}`,
      learnMoreUrl: appUrl(),
      unsubscribeUrl: sponsorUnsubscribeUrl(token),
      assetBase: appUrl(),
    });
    subject = sponsorAslSubject(sponsor.companyName);
  } else if (compTable) {
    html = sponsorInviteEmail({
      contactFirstName: sponsorFirstName(sponsor.contactName, sponsor.companyName),
      companyName: sponsor.companyName,
      suggestedTier: null,
      inviteMessage: sponsor.inviteMessage,
      landingUrl,
      assetBase: appUrl(),
      compExhibitor: true,
      isPartner: partner,
      unsubscribeUrl: sponsorUnsubscribeUrl(token),
    });
    subject = sponsorInviteSubject(sponsor.companyName, { comp: true });
  } else if (suggested?.inviteOnly) {
    // Invite-only tiers (Welcome Kit options) were agreed over email first:
    // the email confirms the arranged deal and links straight to it, rather
    // than pitching the sponsorship levels.
    html = sponsorInviteEmail({
      contactFirstName: sponsorFirstName(sponsor.contactName, sponsor.companyName),
      companyName: sponsor.companyName,
      suggestedTier: suggested,
      inviteMessage: sponsor.inviteMessage,
      landingUrl,
      assetBase: appUrl(),
      isPartner: partner,
      arranged: true,
      unsubscribeUrl: sponsorUnsubscribeUrl(token),
    });
    subject = sponsorArrangedSubject(sponsor.companyName, suggested.name);
  } else {
    html = sponsorLetterEmail({
      contactName: sponsor.contactName,
      recipientTitle: sponsor.contactRole || null,
      companyName: sponsor.companyName,
      reason: sponsor.inviteMessage,
      landingUrl,
      learnMoreUrl: appUrl(),
      discountPercent: null,
      isPartner: partner,
      unsubscribeUrl: sponsorUnsubscribeUrl(token),
      dateLabel: letterDate(),
      assetBase: appUrl(),
    });
    subject = sponsorInviteSubject(sponsor.companyName, { partner });
  }

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject,
      html,
      from: sponsorFromHeader(),
      replyTo: compTable ? sponsorReplyTo() : sponsorLetterReplyTo(),
      headers: sponsorUnsubHeaders(token),
    });
    return NextResponse.json({ ok: true, sponsorId: sponsor.id, sent: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "invite_send_failed", meta: msg.slice(0, 300), actorEmail },
    });
    return NextResponse.json(
      { ok: false, sponsorId: sponsor.id, sent: false, error: msg },
      { status: 502 }
    );
  }
}

async function bulkInvite(
  body: { csv?: string; tier?: string; inviteMessage?: string; compExhibitor?: boolean; draftOnly?: boolean },
  invitedById: string | null,
  actorEmail: string | null,
) {
  const compTable = Boolean(body.compExhibitor);
  // draftOnly = just load them into the dashboard as prospects, send nothing.
  const draftOnly = Boolean(body.draftOnly);
  if (!draftOnly) {
    // The rendered HTML (links, images, unsubscribe) is stored and sent later
    // verbatim — never freeze a localhost base into the queue. Checked before
    // any records are created so a refusal leaves nothing half-queued.
    try {
      assertPublicBaseUrl(appUrl());
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }
  }
  const suggested = compTable ? null : (body.tier ? tierById(body.tier) : null);
  const tierId = compTable ? "exhibitor" : (suggested ? suggested.id : "undecided");
  const food = tierId === "food";
  const asl = tierId === "asl";
  const amountCents = compTable ? 0 : (suggested ? suggested.amountCents : 0);
  // Shared note is the fallback; a row's own Note column overrides it so each
  // invite can read as individually written.
  const defaultNote = body.inviteMessage?.trim() || null;
  const { rows, errors } = buildSponsorInviteRows(body.csv || "");

  const created: { id: string; token: string; companyName: string; contactName: string; contactEmail: string; note: string | null }[] = [];
  const skipped: { email: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    if (seen.has(r.contactEmail)) { skipped.push({ email: r.contactEmail, reason: "duplicate in list" }); continue; }
    seen.add(r.contactEmail);
    // Email-only dedupe (company names drift between "Acme, Inc." and "Acme
    // Inc"); one inbox gets one record, however it's spelled.
    const existing = await prisma.sponsor.findFirst({
      where: { contactEmail: { equals: r.contactEmail, mode: "insensitive" }, mergedIntoId: null },
    });
    if (existing) { skipped.push({ email: r.contactEmail, reason: `already a record (${existing.companyName})` }); continue; }
    const note = r.note?.trim() || defaultNote;
    const token = newSponsorToken();
    const sp = await prisma.sponsor.create({
      data: {
        companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail,
        contactPhone: r.contactPhone || null, website: r.website || null,
        tier: tierId, amountCents, inviteMessage: note, invitedById,
        applicationToken: token, status: draftOnly ? "prospect" : "queued",
      },
    });
    await prisma.sponsorEvent.create({ data: { sponsorId: sp.id, type: draftOnly ? "added_as_prospect" : "added_to_queue", actorEmail } });
    created.push({ id: sp.id, token, companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail, note });
  }

  if (created.length && !draftOnly) {
    const policy = await getPolicy();
    const times = await planSendTimes(created.length, policy);
    const batchId = `sponsor-invite-${Date.now()}`;
    for (let i = 0; i < created.length; i++) {
      const c = created[i];
      const landingUrl = `${appUrl()}/sponsor/invited/${c.token}`;
      const html = food
        ? sponsorFoodLetterEmail({
            contactName: c.contactName,
            companyName: c.companyName,
            note: c.note,
            pledgeUrl: `${appUrl()}/sponsor/food/${c.token}`,
            learnMoreUrl: appUrl(),
            unsubscribeUrl: sponsorUnsubscribeUrl(c.token),
            assetBase: appUrl(),
          })
        : asl
        ? sponsorAslLetterEmail({
            contactName: c.contactName,
            companyName: c.companyName,
            note: c.note,
            pledgeUrl: `${appUrl()}/sponsor/asl/${c.token}`,
            learnMoreUrl: appUrl(),
            unsubscribeUrl: sponsorUnsubscribeUrl(c.token),
            assetBase: appUrl(),
          })
        : compTable
        ? sponsorInviteEmail({
            contactFirstName: sponsorFirstName(c.contactName, c.companyName),
            companyName: c.companyName,
            suggestedTier: null,
            inviteMessage: c.note,
            landingUrl,
            assetBase: appUrl(),
            compExhibitor: true,
            isPartner: isOfficialPartner(c.companyName),
            unsubscribeUrl: sponsorUnsubscribeUrl(c.token),
          })
        : sponsorLetterEmail({
            contactName: c.contactName,
            companyName: c.companyName,
            reason: c.note,
            landingUrl,
            learnMoreUrl: appUrl(),
            discountPercent: null,
            isPartner: isOfficialPartner(c.companyName),
            unsubscribeUrl: sponsorUnsubscribeUrl(c.token),
            dateLabel: letterDate(),
            assetBase: appUrl(),
          });
      await prisma.emailQueue.create({
        data: {
          batchId, recipientType: "sponsor", recipientId: c.id, to: c.contactEmail,
          subject: food
            ? sponsorFoodSubject(c.companyName)
            : asl
            ? sponsorAslSubject(c.companyName)
            : sponsorInviteSubject(c.companyName, { comp: compTable, partner: isOfficialPartner(c.companyName) }),
          html, scheduledFor: times[i], status: "pending",
        },
      });
    }
  }

  return NextResponse.json({ mode: "bulk", created: created.length, skipped, parseErrors: errors, draftOnly });
}
