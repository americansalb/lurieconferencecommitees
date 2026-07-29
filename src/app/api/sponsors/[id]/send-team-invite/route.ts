import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sponsorTeamInviteEmail } from "@/lib/mail-templates";
import { compAllowance, ensureTeamToken, teamUrl } from "@/lib/sponsor-team";
import { tierById, sponsorFromHeader, sponsorLetterReplyTo, sponsorUnsubHeaders, sponsorUnsubscribeUrl } from "@/lib/sponsors";
import { appUrl } from "@/lib/presenters";
import { sendMail } from "@/lib/mail";

// Admin: ask a confirmed sponsor or exhibitor who is attending on their
// included tickets, with the shareable link for the rest of their team.
//
// Sends immediately, like the acceptance letter. The Email Queue exists to
// pace cold outreach so a few thousand invitations don't wreck the sending
// domain; this is a one-off operational note to a partner who is already
// signed up and waiting to hear from us, so drip-feeding it would only add
// delay.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session.user.email || null;

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sponsor.mergedIntoId) return NextResponse.json({ error: "This record was merged into another." }, { status: 409 });
  if (sponsor.unsubscribedAt) {
    return NextResponse.json({ error: "This organization has unsubscribed." }, { status: 409 });
  }
  // Only ask people who are actually coming: a prospect has no table to staff.
  if (!sponsor.paid && sponsor.status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed or paid partners can be asked for their attendee list." },
      { status: 400 }
    );
  }

  const token = await ensureTeamToken(sponsor.id);
  const tier = tierById(sponsor.tier);
  const tierName = sponsor.customTierName || tier?.name || "sponsorship";
  const url = teamUrl(token);

  const html = sponsorTeamInviteEmail({
    contactName: sponsor.contactName,
    companyName: sponsor.companyName,
    tierName,
    // Honours a per-sponsor override, so the letter never promises a free
    // ticket the deal did not include.
    ticketsIncluded: compAllowance(sponsor),
    teamUrl: url,
    siteUrl: appUrl(),
    unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
    assetBase: appUrl(),
  });
  const subject = `Who is joining us from ${sponsor.companyName}?`;

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject,
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: sponsor.additionalEmails,
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "team_invite_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { teamInvitedAt: new Date(), lastSentAt: new Date() },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "team_invite_sent", meta: url, actorEmail },
  }).catch(() => {});

  return NextResponse.json({ ok: true, sent: true, teamUrl: url });
}
