import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sponsorPaidEmail } from "@/lib/mail-templates";
import { sponsorFromHeader, sponsorReplyTo, sponsorStatusUrl, tierById, fullBenefits } from "@/lib/sponsors";

export type ConfirmResult = {
  ok: boolean;
  alreadyPaid: boolean;
  emailed: boolean;
  error?: string;
};

// Idempotently mark a sponsor/exhibitor paid and send the confirmation email.
//
// This is the single source of truth for "a payment landed", called from three
// places: the Stripe webhook, the post-payment success page (which verifies the
// session directly with Stripe), and an admin "Confirm payment" action. Because
// it is idempotent, a payment confirmed by any one of them is safe even if the
// others also fire.
//
// The mark-paid write and the email are deliberately separated: if the email
// throws (a suppressed recipient, a sender misconfig), the paid state is still
// recorded so the money is never "lost" in our system. The original webhook
// did the opposite, and a thrown template or send left records stuck.
export async function confirmSponsorPaid(
  sponsorId: string,
  opts: {
    paymentIntentId?: string | null;
    amountTotal?: number | null;
    sessionId?: string | null;
    actorEmail?: string | null;
    source?: string;      // "webhook" | "success_page" | "admin"
    forceEmail?: boolean; // re-send the confirmation even if already paid
  } = {}
): Promise<ConfirmResult> {
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    include: { logo: { select: { mime: true } } },
  });
  if (!sponsor) return { ok: false, alreadyPaid: false, emailed: false, error: "Sponsor not found" };

  const wasPaid = sponsor.paid;
  if (!wasPaid) {
    await prisma.sponsor.update({
      where: { id: sponsor.id },
      data: {
        paid: true,
        paidAt: new Date(),
        stripePaymentIntentId: opts.paymentIntentId ?? sponsor.stripePaymentIntentId ?? null,
        status: "paid",
      },
    });
    await prisma.sponsorEvent.create({
      data: {
        sponsorId: sponsor.id,
        type: "paid",
        actorEmail: opts.actorEmail ?? null,
        meta: JSON.stringify({
          sessionId: opts.sessionId ?? sponsor.stripeSessionId,
          amount: opts.amountTotal,
          source: opts.source || "system",
        }),
      },
    }).catch(() => {});
  }

  // Don't re-email an already-confirmed sponsor unless explicitly asked to.
  if (wasPaid && !opts.forceEmail) {
    return { ok: true, alreadyPaid: true, emailed: false };
  }

  const t = tierById(sponsor.tier);
  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: "Thank you for sponsoring the 2026 Lurie Children's and AALB Conference",
      html: sponsorPaidEmail({
        firstName: sponsor.contactName.split(" ")[0],
        companyName: sponsor.companyName,
        tierName: t?.name || sponsor.tier,
        amountCents: sponsor.amountCents,
        statusUrl: sponsorStatusUrl(sponsor.applicationToken),
        isExhibitor: sponsor.tier === "exhibitor",
        ticketsIncluded: t?.ticketsIncluded ?? 0,
        wantsLogo: sponsor.wantsLogo,
        hasLogo: !!sponsor.logo,
        registreeName: sponsor.registreeName,
        benefits: fullBenefits(sponsor.tier),
      }),
      from: sponsorFromHeader(),
      replyTo: sponsorReplyTo(),
    });
    // The confirmation is out: advance to "Confirmation sent" so a paid sponsor
    // who never got the email stays visibly stuck at "Paid".
    await prisma.sponsor.update({ where: { id: sponsor.id }, data: { status: "confirmed" } }).catch(() => {});
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "paid_email_sent", actorEmail: opts.actorEmail ?? null, meta: opts.source || null },
    }).catch(() => {});
    return { ok: true, alreadyPaid: wasPaid, emailed: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "paid_email_failed", meta: msg.slice(0, 300) },
    }).catch(() => {});
    // Paid state is recorded; only the email failed. Surface it, don't throw.
    return { ok: true, alreadyPaid: wasPaid, emailed: false, error: msg };
  }
}
