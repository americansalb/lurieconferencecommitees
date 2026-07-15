import { prisma } from "@/lib/db";
import {
  isFoodProspect, isAslProspect, isCompExhibitor, isOfficialPartner,
  sponsorInviteSubject, sponsorFoodSubject, sponsorAslSubject, sponsorArrangedSubject,
  sponsorUnsubscribeUrl, sponsorFirstName, tierById,
} from "@/lib/sponsors";
import { sponsorLetterEmail, sponsorFoodLetterEmail, sponsorAslLetterEmail, sponsorInviteEmail } from "@/lib/mail-templates";

function letterDate() {
  // Dated in Chicago, where the letter is "from" — a UTC server would
  // otherwise stamp an evening send with tomorrow's date on the letterhead.
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago",
  });
}

// Queued emails bake the base URL into HTML that production later sends
// verbatim. A dev instance pointed at the shared database would freeze
// http://localhost:3002 links (and broken images) into real prospects'
// inboxes — refuse to enqueue from a non-public base.
export function assertPublicBaseUrl(base: string) {
  if (!/^https:\/\//i.test(base) || /localhost|127\.0\.0\.1/i.test(base)) {
    throw new Error(
      `Refusing to queue emails with non-public base URL "${base}". Set APP_URL (or NEXTAUTH_URL) to the public https address first.`
    );
  }
}

// Fields the renderer needs off a Sponsor row.
export type SponsorInviteSource = {
  applicationToken: string;
  companyName: string;
  contactName: string;
  contactRole: string | null;
  inviteMessage: string | null;
  tier: string;
  amountCents: number;
};

// Single source of truth for which email a sponsor prospect gets (food / ASL /
// complimentary exhibitor / standard letter) and its subject. Used both when
// first queuing invites and when re-rendering already-queued rows after a
// template change, so the two never drift.
export function renderSponsorInvite(
  s: SponsorInviteSource,
  base: string,
  opts?: { discountPercent?: number | null },
): { subject: string; html: string } {
  const token = s.applicationToken;
  const landingUrl = `${base}/sponsor/invited/${token}`;
  const unsub = sponsorUnsubscribeUrl(token);
  const partner = isOfficialPartner(s.companyName);
  // The 20% VIP courtesy applies only to the standard paid-tier letter; food /
  // ASL (in-kind) and complimentary exhibitors don't carry a discount.
  const discountPercent = opts?.discountPercent ?? null;

  if (isFoodProspect(s)) {
    return {
      subject: sponsorFoodSubject(s.companyName),
      html: sponsorFoodLetterEmail({ contactName: s.contactName, companyName: s.companyName, note: s.inviteMessage, pledgeUrl: `${base}/sponsor/food/${token}`, learnMoreUrl: base, unsubscribeUrl: unsub, assetBase: base }),
    };
  }
  if (isAslProspect(s)) {
    return {
      subject: sponsorAslSubject(s.companyName),
      html: sponsorAslLetterEmail({ contactName: s.contactName, companyName: s.companyName, note: s.inviteMessage, pledgeUrl: `${base}/sponsor/asl/${token}`, learnMoreUrl: base, unsubscribeUrl: unsub, assetBase: base }),
    };
  }
  if (isCompExhibitor(s)) {
    return {
      subject: sponsorInviteSubject(s.companyName, { comp: true }),
      html: sponsorInviteEmail({ contactFirstName: sponsorFirstName(s.contactName, s.companyName), companyName: s.companyName, suggestedTier: null, inviteMessage: s.inviteMessage, landingUrl, assetBase: base, compExhibitor: true, isPartner: partner, unsubscribeUrl: unsub }),
    };
  }
  // Invite-only (arranged) tiers, e.g. the Welcome Kit options: the deal was
  // agreed over email, so the message confirms it and links straight to it.
  const arrangedTier = tierById(s.tier);
  if (arrangedTier?.inviteOnly) {
    return {
      subject: sponsorArrangedSubject(s.companyName, arrangedTier.name),
      html: sponsorInviteEmail({ contactFirstName: sponsorFirstName(s.contactName, s.companyName), companyName: s.companyName, suggestedTier: arrangedTier, inviteMessage: s.inviteMessage, landingUrl, assetBase: base, isPartner: partner, arranged: true, unsubscribeUrl: unsub }),
    };
  }
  return {
    subject: sponsorInviteSubject(s.companyName, { partner }),
    html: sponsorLetterEmail({ contactName: s.contactName, recipientTitle: s.contactRole, companyName: s.companyName, reason: s.inviteMessage, landingUrl, learnMoreUrl: base, discountPercent, isPartner: partner, unsubscribeUrl: unsub, dateLabel: letterDate(), assetBase: base }),
  };
}

// Fields the one-org enqueue needs beyond what the renderer reads.
export type EnqueueSponsor = SponsorInviteSource & {
  id: string;
  contactEmail: string;
  status: string;
};

// Schedule ONE sponsor's invite into the shared paced queue — the only path
// that actually delivers. Renders the correct template (with the optional 20%
// discount for the VIP offer), drops it in due-now so it goes out on the next
// paced tick, promotes a fresh prospect to "queued" (the queue then marks it
// "invited" on send), and persists the discount so checkout auto-applies it.
// This is what the per-org "Queue invite" and "Queue + 20% off" buttons call,
// so no send ever bypasses the queue.
export async function enqueueSponsorInvite(
  s: EnqueueSponsor,
  base: string,
  opts?: { discountPercent?: number | null; actorEmail?: string | null },
): Promise<{ id: string }> {
  // Never freeze a localhost/base-less URL into a queued production email.
  assertPublicBaseUrl(base);
  const discountPercent = opts?.discountPercent ?? null;
  const { subject, html } = renderSponsorInvite(s, base, { discountPercent });
  // Re-queueing replaces, never duplicates: cancel any still-pending row for
  // this sponsor so a second click (or a bulk load plus this button) can't
  // send the same letter twice.
  await prisma.emailQueue.updateMany({
    where: { recipientType: "sponsor", recipientId: s.id, status: "pending" },
    data: { status: "canceled" },
  }).catch(() => {});
  const row = await prisma.emailQueue.create({
    data: {
      batchId: `sponsor-oneoff-${Date.now()}`,
      recipientType: "sponsor",
      recipientId: s.id,
      to: s.contactEmail,
      subject,
      html,
      scheduledFor: new Date(),
      status: "pending",
    },
  });
  await prisma.sponsor.update({
    where: { id: s.id },
    data: {
      ...(s.status === "prospect" ? { status: "queued" } : {}),
      ...(discountPercent != null ? { discountPercent } : {}),
    },
  });
  await prisma.sponsorEvent
    .create({ data: { sponsorId: s.id, type: "added_to_queue", actorEmail: opts?.actorEmail ?? null, meta: discountPercent != null ? `discount ${discountPercent}%` : null } })
    .catch(() => {});
  return { id: row.id };
}
