import {
  isFoodProspect, isAslProspect, isCompExhibitor, isOfficialPartner,
  sponsorInviteSubject, sponsorFoodSubject, sponsorAslSubject, sponsorUnsubscribeUrl,
} from "@/lib/sponsors";
import { sponsorLetterEmail, sponsorFoodLetterEmail, sponsorAslLetterEmail, sponsorInviteEmail } from "@/lib/mail-templates";

function letterDate() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
export function renderSponsorInvite(s: SponsorInviteSource, base: string): { subject: string; html: string } {
  const token = s.applicationToken;
  const landingUrl = `${base}/sponsor/invited/${token}`;
  const unsub = sponsorUnsubscribeUrl(token);
  const partner = isOfficialPartner(s.companyName);

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
      html: sponsorInviteEmail({ contactFirstName: s.contactName.split(" ")[0], companyName: s.companyName, suggestedTier: null, inviteMessage: s.inviteMessage, landingUrl, assetBase: base, compExhibitor: true, isPartner: partner, unsubscribeUrl: unsub }),
    };
  }
  return {
    subject: sponsorInviteSubject(s.companyName, { partner }),
    html: sponsorLetterEmail({ contactName: s.contactName, recipientTitle: s.contactRole, companyName: s.companyName, reason: s.inviteMessage, landingUrl, learnMoreUrl: base, discountPercent: null, isPartner: partner, unsubscribeUrl: unsub, dateLabel: letterDate(), assetBase: base }),
  };
}
