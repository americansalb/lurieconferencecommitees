import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import {
  sponsorFromHeader,
  sponsorLetterReplyTo,
  sponsorInKindAcceptanceSubject,
  sponsorUnsubHeaders,
  sponsorUnsubscribeUrl,
  sponsorStatusUrl,
} from "@/lib/sponsors";
import { sponsorInKindAcceptanceEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

// Per-org "Accept" button for in-kind (Food / ASL) sponsors who have pledged.
// Sends the formal welcome / onboarding letter (as branded as the pledge
// acknowledgement) that asks for their logo, their website, and the logistics,
// then marks them a confirmed sponsor and opens the logo uploader on their
// portal. Admin only, no queue, one click, tracked. Replies reach both the
// founder on the letter and the shared inbox, like the other sponsor letters.
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

  // Accept is the in-kind path only. Paid sponsors are accepted via the
  // "Awaiting payment" transition, which sends its own acceptance + pay email.
  const kind: "food" | "asl" | "captioning" | null =
    sponsor.tier === "asl" ? "asl"
    : sponsor.tier === "food" ? "food"
    : sponsor.tier === "captioning" ? "captioning"
    : null;
  if (!kind) {
    return NextResponse.json(
      { ok: false, sent: false, error: "Accept is for in-kind (Food, ASL, Captioning) sponsors. Use the payment flow for paid tiers." },
      { status: 400 },
    );
  }
  if (sponsor.unsubscribedAt) {
    return NextResponse.json({ ok: false, sent: false, error: "This organization has unsubscribed." }, { status: 409 });
  }

  const html = sponsorInKindAcceptanceEmail({
    kind,
    contactName: sponsor.contactName,
    companyName: sponsor.companyName,
    pledge: sponsor.message,
    materialsUrl: sponsorStatusUrl(sponsor.applicationToken),
    unsubscribeUrl: sponsorUnsubscribeUrl(sponsor.applicationToken),
    assetBase: appUrl(),
  });

  try {
    await sendMail({
      to: sponsor.contactEmail,
      subject: sponsorInKindAcceptanceSubject(sponsor.companyName, kind),
      html,
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: sponsor.additionalEmails,
      headers: sponsorUnsubHeaders(sponsor.applicationToken),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "inkind_accept_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, sent: false, error: msg }, { status: 502 });
  }

  const updated = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      status: "confirmed",
      // Opens the logo uploader on their portal so the email's CTA has somewhere
      // to land, and flags them for logo follow-up on the dashboard.
      wantsLogo: true,
      lastSentAt: new Date(),
    },
  });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: sponsor.id, type: "inkind_accepted", actorEmail, meta: kind } })
    .catch(() => {});

  return NextResponse.json({ ok: true, sent: true, status: updated.status });
}
