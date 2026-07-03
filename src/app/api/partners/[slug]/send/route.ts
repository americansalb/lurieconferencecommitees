import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { partnerBySlug } from "@/lib/partners";
import { partnerOfferEmail } from "@/lib/mail-templates";
import {
  newSponsorToken, sponsorFromHeader, sponsorLetterReplyTo,
  sponsorUnsubHeaders, sponsorUnsubscribeUrl,
} from "@/lib/sponsors";
import { appUrl } from "@/lib/presenters";

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;

// Send the partner thank-you offer (partnerOfferEmail) to one curated partner
// from src/lib/partners.ts. This is the missing plumbing behind that file:
// it creates the two discount codes the letter hands out (so they actually
// work at registration), creates/reuses a Sponsor record so the exhibitor
// discount auto-applies and the unsubscribe link resolves, then sends the
// engraved letter. Admin only, idempotent per partner.
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session?.user?.email || null;

  const partner = partnerBySlug(params.slug);
  if (!partner) return NextResponse.json({ error: "Unknown partner" }, { status: 404 });
  if (!partner.ready || !partner.contactEmail.trim()) {
    return NextResponse.json(
      { error: `${partner.orgName} is not sendable yet (needs a contact email and ready: true in partners.ts).` },
      { status: 400 }
    );
  }
  const staffCode = partner.staffCode.toUpperCase();
  const shareCode = partner.shareCode.toUpperCase();
  if (!CODE_RE.test(staffCode) || !CODE_RE.test(shareCode)) {
    return NextResponse.json({ error: "Partner codes must match ^[A-Z0-9][A-Z0-9_-]{1,39}$." }, { status: 400 });
  }

  // The two gifts the letter promises, created (or refreshed) so they redeem.
  // Updates never touch redeemedCount; the staff code is capped at the number
  // of complimentary seats, the share code is unlimited.
  const codes = [
    {
      code: staffCode,
      description: `Partner ${partner.shortName} — complimentary staff tickets`,
      value: 100,
      maxRedemptions: partner.freeTickets,
    },
    {
      code: shareCode,
      description: `Partner ${partner.shortName} — shareable attendee discount`,
      value: partner.shareDiscountPct,
      maxRedemptions: null as number | null,
    },
  ];
  for (const c of codes) {
    await prisma.discountCode.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        description: c.description,
        kind: "percent",
        virtualValue: c.value,
        inPersonValue: c.value,
        active: true,
        maxRedemptions: c.maxRedemptions,
        createdByEmail: actorEmail,
      },
      update: {
        description: c.description,
        kind: "percent",
        virtualValue: c.value,
        inPersonValue: c.value,
        active: true,
        maxRedemptions: c.maxRedemptions,
      },
    });
  }

  // A Sponsor record carries the third gift (the exhibitor-table discount
  // auto-applies through the invited landing) and the unsubscribe token.
  const email = partner.contactEmail.trim().toLowerCase();
  let sponsor = await prisma.sponsor.findFirst({
    where: { contactEmail: { equals: email, mode: "insensitive" }, mergedIntoId: null },
  });
  if (sponsor?.unsubscribedAt) {
    return NextResponse.json({ error: "This contact has unsubscribed." }, { status: 409 });
  }
  if (!sponsor) {
    sponsor = await prisma.sponsor.create({
      data: {
        companyName: partner.orgName,
        contactName: partner.contactName || partner.orgName,
        contactEmail: email,
        tier: "undecided",
        amountCents: 0,
        discountPercent: partner.exhibitorDiscountPct,
        applicationToken: newSponsorToken(),
        status: "invited",
        invitedAt: new Date(),
        lastSentAt: new Date(),
      },
    });
  } else if (!sponsor.discountPercent) {
    sponsor = await prisma.sponsor.update({
      where: { id: sponsor.id },
      data: { discountPercent: partner.exhibitorDiscountPct },
    });
  }

  const base = appUrl();
  const html = partnerOfferEmail({
    contactName: partner.contactName,
    orgName: partner.orgName,
    intro: partner.intro,
    freeTickets: partner.freeTickets,
    shareDiscountPct: partner.shareDiscountPct,
    exhibitorDiscountPct: partner.exhibitorDiscountPct,
    staffCode,
    shareCode,
    registerUrl: `${base}/register`,
    exhibitorUrl: `${base}/sponsor/invited/${sponsor.applicationToken}`,
    learnMoreUrl: base,
    unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
    assetBase: base,
  });

  try {
    await sendMail({
      to: email,
      subject: `${partner.orgName}, with our thanks: your partner gifts for the 2026 Lurie Children's & AALB Conference`,
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent.create({
      data: { sponsorId: sponsor.id, type: "partner_offer_send_failed", meta: msg.slice(0, 300), actorEmail },
    }).catch(() => {});
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { lastSentAt: new Date() },
  }).catch(() => {});
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "partner_offer_sent", actorEmail, meta: params.slug },
  }).catch(() => {});

  return NextResponse.json({ ok: true, sent: true, sponsorId: sponsor.id, staffCode, shareCode });
}
