import { NextResponse } from "next/server";
import {
  sponsorInviteEmail,
  sponsorLetterEmail,
  sponsorAcceptedEmail,
  sponsorInKindAcceptanceEmail,
  proposalCallEmail,
  bookingInviteEmail,
  bookingConfirmedInviteeEmail,
  ambassadorInviteEmail,
  attendeeInviteEmail,
  attendeeAlumniInviteEmail,
} from "@/lib/mail-templates";
import { fullBenefits } from "@/lib/sponsors";

// Dev-only HTML preview of outreach email templates, so we can eyeball the
// rendered design. Never served in production.
//
//   /dev/email-preview/sponsor
//   /dev/email-preview/cfp-general
//   /dev/email-preview/cfp-healthcare
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ template: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  const { template } = await params;
  const base = process.env.APP_URL || "http://localhost:3002";

  let html: string;
  switch (template) {
    case "sponsor":
      html = sponsorInviteEmail({
        contactFirstName: "Maria",
        companyName: "Northwestern Language Services",
        suggestedTier: {
          name: "Gold Sponsor",
          amountLabel: "$2,500",
          ticketsIncluded: 2,
          tagline: "",
        },
        inviteMessage: null,
        landingUrl: `${base}/sponsor`,
        assetBase: base,
      });
      break;
    case "sponsor-letter":
      html = sponsorLetterEmail({
        contactName: "Jose Antonio Vargas",
        salutation: "Mr. Vargas",
        recipientTitle: "Founder and Chief Executive Officer",
        companyName: "Define American",
        reason:
          "We write to you because few organizations have done more to make the immigrant experience visible and human. The families you have spent a career bringing into focus are the same families our interpreters serve, one conversation at a time, and your support would put that shared commitment in front of the people working to change how this country listens.",
        landingUrl: `${base}/sponsor`,
        learnMoreUrl: base,
        discountPercent: 20,
        dateLabel: "June 27, 2026",
        assetBase: base,
      });
      break;
    case "sponsor-accepted":
      html = sponsorAcceptedEmail({
        firstName: "Maria",
        companyName: "Northwestern Language Services",
        tier: { name: "Gold Sponsor", amountLabel: "$2,500", ticketsIncluded: 2 },
        statusUrl: `${base}/sponsor/status/demo-token`,
        donatesFoodInstead: false,
        isExhibitor: false,
        benefits: fullBenefits("gold"),
        assetBase: base,
      });
      break;
    case "exhibitor-accepted":
      html = sponsorAcceptedEmail({
        firstName: "Jace",
        companyName: "Maya Bridge Language Services",
        tier: { name: "Exhibitor Table", amountLabel: "$650", ticketsIncluded: 1 },
        statusUrl: `${base}/sponsor/status/demo-token`,
        donatesFoodInstead: false,
        isExhibitor: true,
        benefits: fullBenefits("exhibitor"),
        assetBase: base,
      });
      break;
    case "arranged-welcome-kit":
      html = sponsorInviteEmail({
        contactFirstName: "Sharla",
        companyName: "En-Vision America",
        suggestedTier: { name: "Welcome Kit + Virtual Spotlight", amountLabel: "$300", ticketsIncluded: 0, tagline: "" },
        inviteMessage: "Thank you again for your interest in supporting our conference. As promised, here is everything you need to confirm the option we discussed.",
        landingUrl: `${base}/sponsor/invited/demo-token`,
        assetBase: base,
        arranged: true,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
      });
      break;
    case "inkind-accepted-food":
      html = sponsorInKindAcceptanceEmail({
        kind: "food",
        contactName: "Jules",
        companyName: "The Chicago Diner",
        pledge: "Food pledge: A tray of vegan comfort-food entrees for lunch · Est: 60 servings · Arrangement: Donate part, we purchase the rest",
        materialsUrl: `${base}/sponsor/status/demo-token`,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        assetBase: base,
      });
      break;
    case "inkind-accepted-captioning":
      html = sponsorInKindAcceptanceEmail({
        kind: "captioning",
        contactName: "Lydy Pinzón-Dadley",
        companyName: "National Captioning Institute",
        pledge: "Live captioning for the full event, in-person and virtual audiences · Arrangement: donated in kind",
        materialsUrl: `${base}/sponsor/status/demo-token`,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        assetBase: base,
      });
      break;
    case "inkind-accepted-asl":
      html = sponsorInKindAcceptanceEmail({
        kind: "asl",
        contactName: "Dana",
        companyName: "Chicago Hearing Society Interpreting",
        pledge: "ASL pledge: Two interpreters for Saturday's plenary sessions · Arrangement: Donate some hours, we cover the rest",
        materialsUrl: `${base}/sponsor/status/demo-token`,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        assetBase: base,
      });
      break;
    case "cfp-general":
      html = proposalCallEmail({
        variant: "general",
        submitUrl: `${base}/proposal`,
        recipientFirstName: null,
        assetBase: base,
      });
      break;
    case "cfp-healthcare":
      html = proposalCallEmail({
        variant: "healthcare",
        submitUrl: `${base}/proposal`,
        recipientFirstName: null,
        assetBase: base,
      });
      break;
    case "booking-invite":
      html = bookingInviteEmail({
        inviteeName: "Maria Alvarez",
        title: "Conversation about your proposal",
        message: "We loved your submission on interpreter-mediated pediatric care and have a couple of follow-up questions before we finalize the program.",
        durationMin: 30,
        bookUrl: `${base}/book/demo-token`,
      });
      break;
    case "booking-confirmed":
      html = bookingConfirmedInviteeEmail({
        inviteeName: "Maria Alvarez",
        hostName: "Jordan Lee",
        startAt: new Date("2026-06-18T16:00:00Z"),
        durationMin: 30,
        tz: "America/Chicago",
        joinUrl: "https://zoom.us/j/9999999999",
        title: "Conversation about your proposal",
      });
      break;
    case "booking-confirmed-nozoom":
      // The fallback path: booking succeeds but no Zoom link was created.
      html = bookingConfirmedInviteeEmail({
        inviteeName: "Maria Alvarez",
        hostName: "Jordan Lee",
        startAt: new Date("2026-06-18T16:00:00Z"),
        durationMin: 30,
        tz: "America/Chicago",
        joinUrl: null,
        title: "Conversation about your proposal",
      });
      break;
    case "attendee":
      html = attendeeInviteEmail({
        firstName: "Jordan",
        url: `${base}/register?code=JORDAN25`,
        inviteMessage: null,
        discountPercent: 25,
        inPersonOriginalCents: 21000,
        inPersonDiscountedCents: 15750,
        virtualOriginalCents: 10500,
        virtualDiscountedCents: 7875,
        personalCode: "JORDAN25",
        mainSiteUrl: base,
        unsubscribeUrl: `${base}/api/attendees/unsubscribe/preview-token`,
      });
      break;
    case "attendee-alumni":
      html = attendeeAlumniInviteEmail({
        firstName: "Jordan",
        url: `${base}/register?code=JORDAN25`,
        inviteMessage: null,
        discountPercent: 25,
        personalCode: "JORDAN25",
        mainSiteUrl: base,
        learnMoreUrl: base,
        dateLabel: "July 8, 2026",
        assetBase: base,
        unsubscribeUrl: `${base}/api/attendees/unsubscribe/preview-token`,
        inPersonOriginalCents: 21000,
        inPersonDiscountedCents: 15750,
        virtualOriginalCents: 10500,
        virtualDiscountedCents: 7875,
      });
      break;
    case "ambassador":
      html = ambassadorInviteEmail({
        contactName: "Dr. Elena Garcia",
        orgName: "College of DuPage — Healthcare Interpreting Certificate",
        note:
          "Your healthcare interpreting certificate has put trained interpreters into clinics across the western suburbs, and the students working through it right now are exactly who these two days are for. A conference at a children's hospital, full of the people doing the work they are training to do, is the kind of first professional room a student remembers.",
        code: "GARCIA20",
        shareUrl: `${base}/register?code=GARCIA20`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/ambassadors/unsubscribe/preview-token`,
        dateLabel: "July 3, 2026",
        region: "chicago",
        assetBase: base,
      });
      break;
    // The drivable-Midwest variant ("a short trip, not a travel budget").
    case "ambassador-midwest":
      html = ambassadorInviteEmail({
        contactName: "Jenn Sheppard",
        orgName: "Madison College — Healthcare Interpreting Program",
        note:
          "Your two-semester program already carries students through the 40-hour training required for the CCHI exam, and a healthcare language-access conference at a children's hospital is a natural next step for them.",
        code: "SHEPPARD20",
        shareUrl: `${base}/register?code=SHEPPARD20`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/ambassadors/unsubscribe/preview-token`,
        dateLabel: "July 3, 2026",
        region: "midwest",
        assetBase: base,
      });
      break;
    // The virtual-first variant a far-from-Chicago ambassador receives.
    case "ambassador-far":
      html = ambassadorInviteEmail({
        contactName: "",
        orgName: "CHIA — California Healthcare Interpreting Association",
        note:
          "CHIA's whole mission is healthcare interpreting, so a two-day conference hosted with Lurie Children's is about as on-target for your members as an event can be. Many of them work the clinics and hospital floors where language access succeeds or fails, and this is their national conversation.",
        code: "CHIA20",
        shareUrl: `${base}/register?code=CHIA20`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/ambassadors/unsubscribe/preview-token`,
        dateLabel: "July 3, 2026",
        region: "far",
        assetBase: base,
      });
      break;
    default:
      return new NextResponse("Unknown template", { status: 404 });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
