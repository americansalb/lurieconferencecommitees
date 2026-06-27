import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { newSponsorToken, tierById, sponsorFromHeader, sponsorReplyTo, sponsorStatusUrl } from "@/lib/sponsors";
import { sponsorApplicationReceivedEmail, sponsorAdminNotificationEmail } from "@/lib/mail-templates";
import { saveLogoFromDataUrl } from "@/lib/sponsor-logo";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await prisma.sponsor.findMany({
    where: { mergedIntoId: null },
    orderBy: { createdAt: "desc" },
    include: {
      logo: { select: { mime: true } },
      // Latest "they clicked the email link and loaded their page" signal.
      events: {
        where: { type: { in: ["invite_viewed", "inkind_pledge_viewed", "email_clicked"] } },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  const sponsors = raw.map(({ events, ...s }) => ({ ...s, clickedAt: events[0]?.createdAt ?? null }));
  return NextResponse.json({ sponsors });
}

// Public sponsor application. No auth required.
export async function POST(req: Request) {
  const body = await req.json();
  const {
    companyName, contactName, contactEmail, contactPhone, contactRole, website,
    tier, donateFoodInstead, message,
    registreeName, registreeEmail, dietary, accessibility, wantsLogo, logo, agreedToTerms,
  } = body;

  if (!companyName?.trim() || !contactName?.trim() || !isEmail(contactEmail || "") || !contactPhone?.trim() || !tier) {
    return NextResponse.json(
      { error: "Company name, contact name, valid email, phone, and a tier are required." },
      { status: 400 }
    );
  }

  const t = tierById(tier);
  if (!t) return NextResponse.json({ error: "Unknown tier." }, { status: 400 });

  const isExhibitor = t.id === "exhibitor";
  if (isExhibitor) {
    if (!website?.trim()) return NextResponse.json({ error: "A website is required for exhibitors." }, { status: 400 });
    if (!registreeName?.trim()) return NextResponse.json({ error: "Tell us who will staff the table." }, { status: 400 });
    if (!isEmail(registreeEmail || "")) return NextResponse.json({ error: "A valid email for your table representative is required." }, { status: 400 });
  }

  // Food sponsor with donation-in-kind: amount stays 0, no Stripe path.
  const usesAlternative = t.id === "food" && donateFoodInstead === true;
  const amountCents = usesAlternative ? 0 : t.amountCents;

  const token = newSponsorToken();
  const sponsor = await prisma.sponsor.create({
    data: {
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone?.trim() || null,
      contactRole: contactRole?.trim() || null,
      website: website?.trim() || null,
      tier: t.id,
      amountCents,
      donateFoodInstead: usesAlternative,
      message: message?.trim() || null,
      registreeName: isExhibitor ? (registreeName?.trim() || null) : null,
      registreeEmail: isExhibitor ? (registreeEmail?.trim().toLowerCase() || null) : null,
      dietary: isExhibitor ? (dietary?.trim() || null) : null,
      accessibility: isExhibitor ? (accessibility?.trim() || null) : null,
      wantsLogo: isExhibitor ? Boolean(wantsLogo) : false,
      exhibitorDetailsAt: isExhibitor ? new Date() : null,
      applicationToken: token,
      status: "submitted",
    },
  });
  if (isExhibitor && wantsLogo && logo?.dataUrl) {
    await saveLogoFromDataUrl(sponsor.id, logo.dataUrl, logo?.name).catch((e) => console.error("[sponsors] logo save failed", e));
  }
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "submitted", meta: t.id },
  });
  if (isExhibitor && agreedToTerms) {
    await prisma.sponsorEvent.create({ data: { sponsorId: sponsor.id, type: "exhibitor_terms_agreed" } }).catch(() => {});
  }

  // Fire-and-forget notifications. Errors don't block the user's flow.
  sendMail({
    to: sponsor.contactEmail,
    subject: `Thanks for your sponsorship application, ${sponsor.contactName.split(" ")[0]}`,
    html: sponsorApplicationReceivedEmail({
      firstName: sponsor.contactName.split(" ")[0],
      companyName: sponsor.companyName,
      tier: t,
      statusUrl: sponsorStatusUrl(token),
      donatesFoodInstead: usesAlternative,
    }),
    from: sponsorFromHeader(),
    replyTo: sponsorReplyTo(),
  }).catch((e) => console.error("[sponsors] applicant mail failed", e));

  const adminTo = process.env.SPONSOR_ADMIN_NOTIFY || process.env.MAIL_BCC;
  if (adminTo) {
    sendMail({
      to: adminTo,
      subject: `New sponsorship application: ${sponsor.companyName} (${t.name})`,
      html: sponsorAdminNotificationEmail({
        sponsor: {
          companyName: sponsor.companyName,
          contactName: sponsor.contactName,
          contactEmail: sponsor.contactEmail,
          contactPhone: sponsor.contactPhone,
          website: sponsor.website,
          message: sponsor.message,
          tierName: t.name,
          amountLabel: usesAlternative ? "Donated food (in kind)" : t.amountLabel,
        },
      }),
    }).catch((e) => console.error("[sponsors] admin notify failed", e));
  }

  return NextResponse.json({
    ok: true,
    sponsorId: sponsor.id,
    token,
    requiresPayment: amountCents > 0,
  }, { status: 201 });
}
