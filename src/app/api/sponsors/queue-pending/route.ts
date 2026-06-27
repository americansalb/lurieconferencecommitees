import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPolicy, planSendTimes } from "@/lib/email-queue";
import {
  isFoodProspect, isAslProspect, isCompExhibitor, isOfficialPartner,
  sponsorInviteSubject, sponsorFoodSubject, sponsorAslSubject, sponsorUnsubscribeUrl,
} from "@/lib/sponsors";
import { sponsorLetterEmail, sponsorFoodLetterEmail, sponsorAslLetterEmail, sponsorInviteEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

function letterDate() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Push every "Pending invite" prospect into the paced server queue so the Render
// cron sends them in the background, with no page kept open. Each prospect gets
// the right email for its tier (food / ASL / comp / standard letter). Admin only.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const prospects = await prisma.sponsor.findMany({
    where: { status: "prospect", mergedIntoId: null, unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!prospects.length) return NextResponse.json({ ok: true, queued: 0 });

  const policy = await getPolicy();
  const times = await planSendTimes(prospects.length, policy);
  const batchId = `sponsor-queue-${Date.now()}`;
  const base = appUrl();
  let queued = 0;

  for (let i = 0; i < prospects.length; i++) {
    const s = prospects[i];
    const token = s.applicationToken;
    const landingUrl = `${base}/sponsor/invited/${token}`;
    const unsub = sponsorUnsubscribeUrl(token);
    const partner = isOfficialPartner(s.companyName);

    let html: string;
    let subject: string;
    if (isFoodProspect(s)) {
      html = sponsorFoodLetterEmail({ contactName: s.contactName, companyName: s.companyName, note: s.inviteMessage, pledgeUrl: `${base}/sponsor/food/${token}`, learnMoreUrl: base, unsubscribeUrl: unsub, assetBase: base });
      subject = sponsorFoodSubject(s.companyName);
    } else if (isAslProspect(s)) {
      html = sponsorAslLetterEmail({ contactName: s.contactName, companyName: s.companyName, note: s.inviteMessage, pledgeUrl: `${base}/sponsor/asl/${token}`, learnMoreUrl: base, unsubscribeUrl: unsub, assetBase: base });
      subject = sponsorAslSubject(s.companyName);
    } else if (isCompExhibitor(s)) {
      html = sponsorInviteEmail({ contactFirstName: s.contactName.split(" ")[0], companyName: s.companyName, suggestedTier: null, inviteMessage: s.inviteMessage, landingUrl, assetBase: base, compExhibitor: true, isPartner: partner, unsubscribeUrl: unsub });
      subject = sponsorInviteSubject(s.companyName, { comp: true });
    } else {
      html = sponsorLetterEmail({ contactName: s.contactName, recipientTitle: s.contactRole, companyName: s.companyName, reason: s.inviteMessage, landingUrl, learnMoreUrl: base, discountPercent: null, isPartner: partner, unsubscribeUrl: unsub, dateLabel: letterDate(), assetBase: base });
      subject = sponsorInviteSubject(s.companyName, { partner });
    }

    await prisma.emailQueue.create({
      data: { batchId, recipientType: "sponsor", recipientId: s.id, to: s.contactEmail, subject, html, scheduledFor: times[i], status: "pending" },
    });
    await prisma.sponsor.update({ where: { id: s.id }, data: { status: "queued" } });
    await prisma.sponsorEvent.create({ data: { sponsorId: s.id, type: "added_to_queue", actorEmail: session?.user?.email || null } }).catch(() => {});
    queued++;
  }

  return NextResponse.json({ ok: true, queued });
}
