import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { newSponsorToken, tierById, sponsorFromHeader, sponsorReplyTo } from "@/lib/sponsors";
import { sponsorInviteEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";
import { getPolicy, planSendTimes } from "@/lib/email-queue";
import { parseTable } from "@/lib/imports";

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
    tier, inviteMessage,
  } = body;

  if (!companyName?.trim() || !contactName?.trim() || !isEmail(contactEmail || "")) {
    return NextResponse.json(
      { error: "Company, contact name, and a valid email are required." },
      { status: 400 }
    );
  }

  // tier is now optional. "undecided" means the invitee will pick on the landing page.
  const suggested = tier ? tierById(tier) : null;
  const tierId = suggested ? suggested.id : "undecided";
  const amountCents = suggested ? suggested.amountCents : 0;

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
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: `Invitation to Sponsor the 2026 Lurie Children's and AALB Conference`,
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
  body: { csv?: string; tier?: string; inviteMessage?: string },
  invitedById: string | null,
  actorEmail: string | null,
) {
  const suggested = body.tier ? tierById(body.tier) : null;
  const tierId = suggested ? suggested.id : "undecided";
  const amountCents = suggested ? suggested.amountCents : 0;
  const inviteMessage = body.inviteMessage?.trim() || null;
  const { rows, errors } = parseSponsorInviteCsv(body.csv || "");

  const created: { id: string; token: string; companyName: string; contactName: string; contactEmail: string }[] = [];
  const skipped: { email: string; reason: string }[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    if (seen.has(r.contactEmail)) { skipped.push({ email: r.contactEmail, reason: "duplicate in list" }); continue; }
    seen.add(r.contactEmail);
    const existing = await prisma.sponsor.findFirst({ where: { contactEmail: r.contactEmail, companyName: r.companyName } });
    if (existing) { skipped.push({ email: r.contactEmail, reason: "already a record" }); continue; }
    const token = newSponsorToken();
    const sp = await prisma.sponsor.create({
      data: {
        companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail,
        contactPhone: r.contactPhone || null, website: r.website || null,
        tier: tierId, amountCents, inviteMessage, invitedById,
        applicationToken: token, status: "queued",
      },
    });
    await prisma.sponsorEvent.create({ data: { sponsorId: sp.id, type: "added_to_queue", actorEmail } });
    created.push({ id: sp.id, token, companyName: r.companyName, contactName: r.contactName, contactEmail: r.contactEmail });
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
        inviteMessage,
        landingUrl,
        assetBase: appUrl(),
      });
      await prisma.emailQueue.create({
        data: {
          batchId, recipientType: "sponsor", recipientId: c.id, to: c.contactEmail,
          subject: `Invitation to Sponsor the 2026 Lurie Children's and AALB Conference`,
          html, scheduledFor: times[i], status: "pending",
        },
      });
    }
  }

  return NextResponse.json({ mode: "bulk", created: created.length, skipped, parseErrors: errors });
}

type SponsorRow = { companyName: string; contactName: string; contactEmail: string; contactPhone?: string; website?: string };

// Parse a pasted prospect list. Maps columns by header when present
// (Company / Contact / Email / Phone / Website), else falls back to that order.
function parseSponsorInviteCsv(text: string): { rows: SponsorRow[]; errors: string[] } {
  const errors: string[] = [];
  const out: SponsorRow[] = [];
  const all = parseTable(text);
  if (!all.length) return { rows: out, errors };

  const headerish = /email|company|organization|contact/i.test(all[0].join(" "));
  const header = headerish ? all[0] : null;
  const find = (re: RegExp, exclude: number[] = []) => {
    if (!header) return -1;
    for (let i = 0; i < header.length; i++) if (!exclude.includes(i) && re.test((header[i] || "").trim())) return i;
    return -1;
  };

  let idx: { company: number; contact: number; email: number; phone: number; website: number };
  if (header) {
    const company = find(/company|organization|^org/i);
    const email = find(/email/i);
    const contact = find(/contact|first ?name|^name$|representative/i, [company, email]);
    idx = { company, contact, email, phone: find(/phone/i), website: find(/website|url|^site/i) };
  } else {
    idx = { company: 0, contact: 1, email: 2, phone: 3, website: 4 };
  }

  const data = header ? all.slice(1) : all;
  data.forEach((r, n) => {
    const email = (r[idx.email] ?? "").trim().toLowerCase();
    const company = (idx.company >= 0 ? (r[idx.company] ?? "") : "").trim();
    const contact = (idx.contact >= 0 ? (r[idx.contact] ?? "") : "").trim();
    if (!isEmail(email)) { errors.push(`Row ${n + 1}: "${r[idx.email] ?? ""}" is not a valid email — skipped.`); return; }
    if (!company) { errors.push(`Row ${n + 1} (${email}): missing company — skipped.`); return; }
    out.push({
      companyName: company,
      contactName: contact || company,
      contactEmail: email,
      contactPhone: (idx.phone >= 0 ? (r[idx.phone] ?? "").trim() : "") || undefined,
      website: (idx.website >= 0 ? (r[idx.website] ?? "").trim() : "") || undefined,
    });
  });
  return { rows: out, errors };
}
