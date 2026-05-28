import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { newSponsorToken, tierById, sponsorFromHeader, sponsorReplyTo } from "@/lib/sponsors";
import { sponsorInviteEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

// Invite a target sponsor: creates a Sponsor record with status="invited",
// emails a personalized invitation with a link to the pre-filled landing page.
// Any authenticated team member can send.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invitedById = (session.user as { id?: string }).id || null;
  const actorEmail = session.user.email || null;
  const actorName = session.user.name || null;

  const body = await req.json();
  const {
    companyName, contactName, contactEmail, contactPhone, contactRole, website,
    tier, inviteMessage,
  } = body;

  if (!companyName?.trim() || !contactName?.trim() || !isEmail(contactEmail || "") || !tier) {
    return NextResponse.json(
      { error: "Company, contact name, valid email, and a tier are required." },
      { status: 400 }
    );
  }

  const t = tierById(tier);
  if (!t) return NextResponse.json({ error: "Unknown tier." }, { status: 400 });

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
      tier: t.id,
      amountCents: t.amountCents,
      inviteMessage: inviteMessage?.trim() || null,
      invitedById,
      invitedAt: new Date(),
      lastSentAt: new Date(),
      applicationToken: token,
      status: "invited",
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "invite_sent", actorEmail, meta: t.id },
  });

  const landingUrl = `${appUrl()}/sponsor/invited/${token}`;
  const html = sponsorInviteEmail({
    contactFirstName: sponsor.contactName.split(" ")[0],
    companyName: sponsor.companyName,
    tier: t,
    inviteMessage: sponsor.inviteMessage,
    senderName: actorName,
    landingUrl,
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: `${sponsor.companyName}: invitation to sponsor the 2026 Lurie Children's and AALB Conference`,
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
