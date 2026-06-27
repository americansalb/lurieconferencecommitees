import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sponsorFromHeader, sponsorReplyTo, sponsorLetterReplyTo, sponsorInviteSubject, sponsorFoodSubject, sponsorAslSubject, sponsorUnsubHeaders, sponsorUnsubscribeUrl, isCompExhibitor, isFoodProspect, isAslProspect, isOfficialPartner } from "@/lib/sponsors";
import { sponsorInviteEmail, sponsorLetterEmail, sponsorFoodLetterEmail, sponsorAslLetterEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

// Per-org "Send invite" button on the dashboard: send (or resend) the
// invitation to one sponsor and mark them invited. One click, one email,
// tracked. No queue, no pacing.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const actorEmail = session.user.email || null;

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sponsor.unsubscribedAt) {
    return NextResponse.json({ ok: false, sent: false, error: "This organization has unsubscribed." }, { status: 409 });
  }

  const comp = isCompExhibitor(sponsor);
  const food = isFoodProspect(sponsor);
  const asl = isAslProspect(sponsor);
  const partner = isOfficialPartner(sponsor.companyName);
  const landingUrl = `${appUrl()}/sponsor/invited/${sponsor.applicationToken}`;

  // The formal letter is the standard invitation for every sponsor prospect.
  // A complimentary exhibitor table is a different ask (a free table, not a
  // sponsorship), so it keeps the dedicated "claim your table" email. The 20%
  // VIP courtesy is added only via the separate send-letter action.
  let html: string;
  let subject: string;
  if (food) {
    // Restaurant/caterer: the in-kind plant-based meal ask.
    html = sponsorFoodLetterEmail({
      contactName: sponsor.contactName,
      companyName: sponsor.companyName,
      note: sponsor.inviteMessage,
      pledgeUrl: `${appUrl()}/sponsor/food/${sponsor.applicationToken}`,
      learnMoreUrl: appUrl(),
      unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
      assetBase: appUrl(),
    });
    subject = sponsorFoodSubject(sponsor.companyName);
  } else if (asl) {
    // ASL interpreting company: the in-kind interpretation ask.
    html = sponsorAslLetterEmail({
      contactName: sponsor.contactName,
      companyName: sponsor.companyName,
      note: sponsor.inviteMessage,
      pledgeUrl: `${appUrl()}/sponsor/asl/${sponsor.applicationToken}`,
      learnMoreUrl: appUrl(),
      unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
      assetBase: appUrl(),
    });
    subject = sponsorAslSubject(sponsor.companyName);
  } else if (comp) {
    html = sponsorInviteEmail({
      contactFirstName: sponsor.contactName.split(" ")[0],
      companyName: sponsor.companyName,
      suggestedTier: null,
      inviteMessage: sponsor.inviteMessage,
      landingUrl,
      assetBase: appUrl(),
      compExhibitor: true,
      isPartner: partner,
      unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
    });
    subject = sponsorInviteSubject(sponsor.companyName, { comp: true });
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
      unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
      dateLabel: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
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
      // Replies to the letter reach both Kevin and the shared inbox.
      replyTo: comp ? sponsorReplyTo() : sponsorLetterReplyTo(),
      cc: sponsor.additionalEmails,
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "invite_send_failed", meta: msg.slice(0, 300), actorEmail },
    });
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  const updated = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      // First send moves a prospect to "invited"; a resend just bumps the
      // timestamp and leaves a later status (in_conversation, etc.) alone.
      status: sponsor.status === "prospect" || sponsor.status === "queued" ? "invited" : sponsor.status,
      invitedAt: sponsor.invitedAt ?? new Date(),
      lastSentAt: new Date(),
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "invite_sent", actorEmail, meta: sponsor.status },
  });

  return NextResponse.json({ ok: true, sent: true, status: updated.status });
}
