import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sponsorPaymentReminderEmail } from "@/lib/mail-templates";
import {
  tierById, sponsorStatusUrl, sponsorFromHeader, sponsorLetterReplyTo,
  sponsorUnsubHeaders, sponsorUnsubscribeUrl,
} from "@/lib/sponsors";
import { appUrl } from "@/lib/presenters";

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

// Chase an accepted sponsor or exhibitor who has not paid. Sends immediately:
// they already said yes, and the queue is for pacing cold outreach, not for
// a one-off note to someone who is expecting to hear from us.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session.user.email || null;

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: params.id },
    include: { logo: { select: { mime: true } } },
  });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sponsor.mergedIntoId) return NextResponse.json({ error: "This record was merged into another." }, { status: 409 });
  if (sponsor.unsubscribedAt) {
    return NextResponse.json({ error: "This organization has unsubscribed." }, { status: 409 });
  }
  // Never chase someone who has already paid, or who owes nothing.
  if (sponsor.paid) {
    return NextResponse.json({ error: "They have already paid." }, { status: 409 });
  }
  if (sponsor.donateFoodInstead || sponsor.amountCents <= 0) {
    return NextResponse.json({ error: "This is an in-kind or complimentary partner; there is nothing to pay." }, { status: 400 });
  }
  // Only chase people who have actually been accepted. A prospect who has
  // never been invited should get an invitation, not an invoice.
  const chaseable = ["awaiting_payment", "accepted", "confirmed", "in_conversation", "submitted"];
  if (!chaseable.includes(sponsor.status)) {
    return NextResponse.json(
      { error: `Not awaiting payment (status: ${sponsor.status}). Accept them first.` },
      { status: 400 }
    );
  }

  const tier = tierById(sponsor.tier);
  const tierName = sponsor.customTierName || tier?.name || "Sponsorship";
  const reminderNumber = (sponsor.paymentRemindCount || 0) + 1;

  const html = sponsorPaymentReminderEmail({
    contactName: sponsor.contactName,
    companyName: sponsor.companyName,
    tierName,
    amountLabel: money(sponsor.amountCents),
    payUrl: sponsorStatusUrl(sponsor.applicationToken),
    hasLogo: !!sponsor.logo,
    reminderNumber,
    siteUrl: appUrl(),
    unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
    assetBase: appUrl(),
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: reminderNumber > 1
        ? `Still holding your table: ${sponsor.companyName}`
        : `One step left to confirm ${sponsor.companyName}`,
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: sponsor.additionalEmails,
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "payment_reminder_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      paymentRemindedAt: new Date(),
      paymentRemindCount: { increment: 1 },
      lastSentAt: new Date(),
      // Chasing payment implies they were accepted; make the board agree.
      ...(sponsor.status === "awaiting_payment" ? {} : { status: "awaiting_payment" }),
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "payment_reminder_sent", meta: `#${reminderNumber}`, actorEmail },
  }).catch(() => {});

  return NextResponse.json({ ok: true, sent: true, reminderNumber });
}
