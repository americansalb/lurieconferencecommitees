import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { tierById, sponsorFromHeader, sponsorReplyTo, isCompExhibitor } from "@/lib/sponsors";
import { sponsorInviteEmail } from "@/lib/mail-templates";
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

  const comp = isCompExhibitor(sponsor);
  const suggested = comp
    ? null
    : sponsor.tier && sponsor.tier !== "undecided"
    ? tierById(sponsor.tier) ?? null
    : null;
  const landingUrl = `${appUrl()}/sponsor/invited/${sponsor.applicationToken}`;
  const html = sponsorInviteEmail({
    contactFirstName: sponsor.contactName.split(" ")[0],
    companyName: sponsor.companyName,
    suggestedTier: suggested,
    inviteMessage: sponsor.inviteMessage,
    landingUrl,
    assetBase: appUrl(),
    compExhibitor: comp,
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: comp
        ? `You're invited: a complimentary exhibitor table at the 2026 Lurie Children's and AALB Conference`
        : `Invitation to Sponsor the 2026 Lurie Children's and AALB Conference`,
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorReplyTo(),
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
