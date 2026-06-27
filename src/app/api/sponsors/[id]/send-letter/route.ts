import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sponsorFromHeader, sponsorLetterReplyTo, sponsorInviteSubject, isOfficialPartner } from "@/lib/sponsors";
import { sponsorLetterEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

// Per-org "Send personal letter" button on the dashboard: send the formal,
// founder-signed letter (Kevin + Zachary) to one marquee prospect, reusing the
// org's saved Personal note as the letter's personalized paragraph. Replies go
// straight to kevin@aalb.org, the way the speaker invitations do. Admin only,
// no queue, no pacing, one click, tracked.
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

  // VIP courtesy: 20% off any paid level, including the exhibitor table.
  // Only a complimentary (already-free) table gets no discount.
  const discountPercent = (sponsor.tier === "exhibitor" && sponsor.amountCents <= 0) ? null : 20;
  const dateLabel = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const html = sponsorLetterEmail({
    contactName: sponsor.contactName,
    recipientTitle: sponsor.contactRole || null,
    companyName: sponsor.companyName,
    reason: sponsor.inviteMessage,
    landingUrl: `${appUrl()}/sponsor/invited/${sponsor.applicationToken}`,
    learnMoreUrl: appUrl(),
    discountPercent,
    isPartner: isOfficialPartner(sponsor.companyName),
    dateLabel,
    assetBase: appUrl(),
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: sponsorInviteSubject(sponsor.companyName, { partner: isOfficialPartner(sponsor.companyName) }),
      html,
      from: sponsorFromHeader(),
      // Replies reach both Kevin (on the letter) and the shared inbox.
      replyTo: sponsorLetterReplyTo(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "letter_send_failed", meta: msg.slice(0, 300), actorEmail },
    });
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  const updated = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      status: sponsor.status === "prospect" || sponsor.status === "queued" ? "invited" : sponsor.status,
      invitedAt: sponsor.invitedAt ?? new Date(),
      lastSentAt: new Date(),
      // Persist eligibility so the discount auto-applies when they check out.
      discountPercent,
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "letter_sent", actorEmail, meta: sponsor.status },
  });

  return NextResponse.json({ ok: true, sent: true, status: updated.status });
}
