import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sponsorTeamInviteEmail } from "@/lib/mail-templates";
import { ensureTeamToken, teamUrl } from "@/lib/sponsor-team";
import { tierById } from "@/lib/sponsors";
import { appUrl } from "@/lib/presenters";
import { getPolicy, planSendTimes } from "@/lib/email-queue";

// Admin: ask a confirmed sponsor or exhibitor who is attending on their
// included tickets, with the shareable link for the rest of their team.
// Goes through the paced Email Queue like everything else, so nothing sends
// straight out of a button click.
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
    ticketsIncluded: tier?.ticketsIncluded ?? 0,
    teamUrl: url,
    siteUrl: appUrl(),
  });
  const subject = `Who is joining us from ${sponsor.companyName}?`;

  // Never leave two of these pending against the same organization.
  await prisma.emailQueue.updateMany({
    where: { recipientType: "sponsor", recipientId: sponsor.id, status: "pending", subject },
    data: { status: "cancelled" },
  });

  const policy = await getPolicy();
  const [scheduledFor] = await planSendTimes(1, policy);
  await prisma.emailQueue.create({
    data: {
      batchId: `sponsor-team-${sponsor.id}`,
      recipientType: "sponsor",
      recipientId: sponsor.id,
      to: sponsor.contactEmail,
      subject,
      html,
      scheduledFor,
      status: "pending",
    },
  });
  await prisma.sponsor.update({ where: { id: sponsor.id }, data: { teamInvitedAt: new Date() } });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "team_invite_queued", meta: url, actorEmail },
  }).catch(() => {});

  return NextResponse.json({ ok: true, queued: true, teamUrl: url });
}
