import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/presenters";
import { foodPlanEmail } from "@/lib/mail-templates";
import {
  tierById, sponsorStatusUrl, sponsorFromHeader, sponsorLetterReplyTo, sponsorUnsubHeaders,
} from "@/lib/sponsors";

// Confirm a food partner's arrangement back to them once they have filled in
// their logistics: what they are sending, who moves it and when, and only the
// details still missing.
//
// This is what a food sponsor gets instead of the exhibitor guide. They have
// no table, so load-in times and shipping labels are not just irrelevant to
// them, they are alarming.
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
  if (sponsor.tier !== "food") {
    return NextResponse.json({ error: "This is the food partner confirmation; it only applies to Food Sponsors." }, { status: 400 });
  }

  const logistics = (sponsor.logistics as Record<string, string> | null) || null;
  // Sending a "here is the plan" letter with an empty plan would read as a
  // mistake, and it is: they have not filled the form in yet.
  if (!logistics || !Object.values(logistics).some((v) => (v || "").trim())) {
    return NextResponse.json(
      { error: "They have not filled in their food logistics yet, so there is no plan to confirm. Chase the details first." },
      { status: 400 }
    );
  }

  const tier = tierById(sponsor.tier);
  const html = foodPlanEmail({
    contactName: sponsor.contactName,
    companyName: sponsor.companyName,
    logistics,
    portalUrl: sponsorStatusUrl(sponsor.applicationToken),
    ticketsIncluded: sponsor.ticketsIncluded ?? tier?.ticketsIncluded ?? 0,
    assetBase: appUrl(),
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: `Your food details for August 15, confirmed`,
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: sponsor.additionalEmails,
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "food_plan_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { guideSentAt: new Date(), lastSentAt: new Date() },
  });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: sponsor.id, type: "food_plan_sent", actorEmail } })
    .catch(() => {});

  return NextResponse.json({ ok: true, sent: true });
}
