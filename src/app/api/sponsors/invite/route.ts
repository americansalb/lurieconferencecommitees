import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { newSponsorToken, tierById, sponsorFromHeader, sponsorReplyTo } from "@/lib/sponsors";
import { sponsorInviteEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";
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
  const suggested = compTable ? null : (tier ? tierById(tier) : null);
  const tierId = compTable ? "exhibitor" : (suggested ? suggested.id : "undecided");
  const amountCents = compTable ? 0 : (suggested ? suggested.amountCents : 0);

  const email = contactEmail.trim().toLowerCase();
  const existing = await prisma.sponsor.findFirst({
    where: { contactEmail: email, companyName: companyName.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: `${companyName} (${email}) already has a sponsorship record. Open it from the list.`, sponsorId: existing.id },
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
  const html = sponsorInviteEmail({
    contactFirstName: sponsor.contactName.split(" ")[0],
    companyName: sponsor.companyName,
    suggestedTier: suggested ?? null,
    inviteMessage: sponsor.inviteMessage,
    landingUrl,
    assetBase: appUrl(),
    compExhibitor: compTable,
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: compTable
        ? `You're invited: a complimentary exhibitor table at the 2026 Lurie Children's and AALB Conference`
        : `Invitation to Sponsor the 2026 Lurie Children's and AALB Conference`,
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorReplyTo(),
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
  body: { csv?: string; tier?: string; inviteMessage?: string; compExhibitor?: boolean },
  invitedById: string | null,
  actorEmail: string | null,
) {
  const compTable = Boolean(body.compExhibitor);
  const suggested = compTable ? null : (body.tier ? tierById(body.tier) : null);
  const tierId = compTable ? "exhibitor" : (suggested ? suggested.id : "undecided");
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
    const existing = await prisma.sponsor.findFirst({ where: { contactEmail: r.contactEmail, companyName: r.companyName } });
    if (existing) { skipped.push({ email: r.contactEmail, reason: "already a record" }); continue; }
    const note = r.note?.trim() || defaultNote;
    const token = newSponsorToken();
    const sp = await prisma.sponsor.create({
      data: {
        companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail,
        contactPhone: r.contactPhone || null, website: r.website || null,
        tier: tierId, amountCents, inviteMessage: note, invitedById,
        applicationToken: token, status: "queued",
      },
    });
    await prisma.sponsorEvent.create({ data: { sponsorId: sp.id, type: "added_to_queue", actorEmail } });
    created.push({ id: sp.id, token, companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail, note });
  }

  if (created.length) {
    const policy = await getPolicy();
    const times = await planSendTimes(created.length, policy);
    const batchId = `sponsor-invite-${Date.now()}`;
    for (let i = 0; i < created.length; i++) {
      const c = created[i];
      const landingUrl = `${appUrl()}/sponsor/invited/${c.token}`;
      const html = sponsorInviteEmail({
        contactFirstName: c.contactName.split(" ")[0],
        companyName: c.companyName,
        suggestedTier: suggested ?? null,
        inviteMessage: c.note,
        landingUrl,
        assetBase: appUrl(),
        compExhibitor: compTable,
      });
      await prisma.emailQueue.create({
        data: {
          batchId, recipientType: "sponsor", recipientId: c.id, to: c.contactEmail,
          subject: compTable
            ? `You're invited: a complimentary exhibitor table at the 2026 Lurie Children's and AALB Conference`
            : `Invitation to Sponsor the 2026 Lurie Children's and AALB Conference`,
          html, scheduledFor: times[i], status: "pending",
        },
      });
    }
  }

  return NextResponse.json({ mode: "bulk", created: created.length, skipped, parseErrors: errors });
}
