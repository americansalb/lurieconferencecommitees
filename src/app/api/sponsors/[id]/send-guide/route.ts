import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { exhibitorGuideEmail } from "@/lib/mail-templates";
import { compAllowance, ensureTeamToken, seatSummary, teamFor, teamUrl } from "@/lib/sponsor-team";
import {
  tierById, sponsorFromHeader, sponsorLetterReplyTo, sponsorUnsubHeaders,
} from "@/lib/sponsors";

// Send one exhibitor their personalized guide. Immediate, like the acceptance
// letter: they are already confirmed and this is operational information they
// need before they travel, not outreach to be paced.
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
  // The guide is about standing at a table. Someone who has not confirmed has
  // no table, and load-in times would only confuse them.
  if (!sponsor.paid && sponsor.status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed or paid partners can be sent the exhibitor guide." },
      { status: 400 }
    );
  }

  const token = await ensureTeamToken(sponsor.id);
  const team = await teamFor(sponsor.id);
  const seats = seatSummary(team, compAllowance(sponsor));

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: `Your exhibitor guide for ${sponsor.companyName}`,
      html: exhibitorGuideEmail({
        contactName: sponsor.contactName,
        companyName: sponsor.companyName,
        teamUrl: teamUrl(token),
        seatsRemaining: seats.remaining,
        team: team.map((m) => ({ name: `${m.firstName} ${m.lastName}`.trim() || m.email, comp: m.comp })),
        assetBase: appUrl(),
      }),
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: sponsor.additionalEmails,
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
      // The guide exactly as designed, fetched by Resend rather than rebuilt
      // per organization.
      attachments: [{
        filename: "2026-conference-exhibitor-guide.pdf",
        path: `${appUrl()}/guides/exhibitor-guide.pdf`,
      }],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "guide_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { guideSentAt: new Date(), lastSentAt: new Date() },
  });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: sponsor.id, type: "guide_sent", actorEmail } })
    .catch(() => {});

  return NextResponse.json({ ok: true, sent: true });
}
