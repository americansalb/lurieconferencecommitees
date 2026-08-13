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
  sponsorTeamInviteEmail,
  sponsorPaymentReminderEmail,
  sponsorAslUrgentLetterEmail,
  attendeeGuideEmail,
  chicagoGuideEmail,
  exhibitorGuideEmail,
  foodPlanEmail,
  sponsorAslLetterEmail,
  sponsorFoodLetterEmail,
  plainStandardInviteEmail,
  plainCommunityInviteEmail,
  virtualAttendeeInfoEmail,
} from "@/lib/mail-templates";
import { zoomDaysFor } from "@/lib/virtual-event";
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
    case "asl-invite":
      html = sponsorAslLetterEmail({
        contactName: "",
        companyName: "Chicago Hearing Society (Anixter Center)",
        note: "Chicago Hearing Society has been the city's own answer to this question for decades, and your interpreting and captioning desk is the number Chicago institutions call when a Deaf patient or family needs access.",
        pledgeUrl: `${base}/sponsor/asl/demo-token`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        assetBase: base,
      });
      break;
    case "food-invite":
      html = sponsorFoodLetterEmail({
        contactName: "Jules",
        companyName: "The Chicago Diner",
        note: "The Chicago Diner has been serving meat-free comfort food in Lakeview since 1983, long before anyone called it a trend.",
        pledgeUrl: `${base}/sponsor/food/demo-token`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        assetBase: base,
      });
      break;
    case "food-plan":
      html = foodPlanEmail({
        contactName: "Michael Hornick",
        companyName: "The Chicago Diner",
        contactPhone: "(773) 935-6696",
        logistics: {
          day: "Saturday, August 15", meal: "Lunch",
          setup: "Warming container for half pans. We will provide tongs, and spoons.",
          attending: "Not sure yet", window: "11am - 12:00pm",
          provide: "Our famous Reuben in a crispy handheld appetizer, 120 pieces to feed 70-80 people",
          allergens: "Contains: Gluten, Soy",
          fulfillment: "Please arrange pickup", dayOfContact: "Michael Hornick",
        },
        portalUrl: `${base}/sponsor/status/demo-token`,
        ticketsIncluded: 2, assetBase: base,
      });
      break;
    case "virtual-info":
      html = virtualAttendeeInfoEmail({
        firstName: "Miriam",
        days: zoomDaysFor(null),
        portalUrl: `${base}/attend/demo-token`,
        exhibitorsUrl: `${base}/#sponsors`,
        scheduleUrl: `${base}/#program`,
        assetBase: base,
      });
      break;
    case "virtual-info-sat":
      html = virtualAttendeeInfoEmail({
        firstName: "Miriam",
        days: zoomDaysFor("sat"),
        portalUrl: `${base}/attend/demo-token`,
        exhibitorsUrl: `${base}/#sponsors`,
        scheduleUrl: `${base}/#program`,
        assetBase: base,
      });
      break;
    case "attendee-guide":
      html = attendeeGuideEmail({
        firstName: "Priya", lastName: "Raman",
        portalUrl: `${base}/attend/demo-token`, attendanceMode: "in-person",
        dietary: "Vegetarian, no nuts please",
        accessibilityNotes: "CART captioning if available, and a quiet space between sessions.",
        primaryLanguages: "Spanish, Hindi", needsParking: true,
        assetBase: base,
      });
      break;
    case "chicago-guide":
      html = chicagoGuideEmail({
        firstName: "Priya",
        signupUrl: "https://docs.google.com/forms/d/e/1FAIpQLSer1Ry7AEBrk9yLpcG3bEgpivA9xAgsQOk_Zl__PT39mpF35g/viewform",
        screenReaderUrl: `${base}/guides/welcome-to-chicago-screen-reader.pdf`,
        assetBase: base,
      });
      break;
    case "exhibitor-guide":
      html = exhibitorGuideEmail({
        contactName: "Jill Nelson", companyName: "Multilingual Connections",
        teamUrl: `${base}/exhibitor/demo-team-token`, seatsRemaining: 1,
        team: [{ name: "Jill Nelson", comp: true }, { name: "Dana Ortiz", comp: false }],
        assetBase: base,
      });
      break;
    case "asl-urgent":
      html = sponsorAslUrgentLetterEmail({
        contactName: "",
        companyName: "Chicago Hearing Society (Anixter Center)",
        note: "Chicago Hearing Society has been the city's own answer to this question for decades, and your interpreting and captioning desk is the number Chicago institutions call when a Deaf patient or family needs access. We are a language access conference at a Chicago children's hospital, so you are the first organization we thought of, and the closest to home. Interpreters, clinicians, and hospital language services leaders will be in the room, and Deaf and hard of hearing attendees are among them.",
        pledgeUrl: `${base}/sponsor/asl/demo-token`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        assetBase: base,
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
    case "attendee-cmi": {
      const { plainCmiInviteEmail } = await import("@/lib/mail-templates");
      html = plainCmiInviteEmail({
        firstName: "Lyan",
        url: `${base}/attend/preview-token`,
        inviteMessage: null,
        discountPercent: 25,
        inPersonOriginalCents: 21000,
        inPersonDiscountedCents: 15750,
        virtualOriginalCents: 10500,
        virtualDiscountedCents: 7875,
        personalCode: "LYAN25",
        mainSiteUrl: `${base}/register`,
        learnMoreUrl: base,
        unsubscribeUrl: `${base}/api/attendees/unsubscribe/preview-token`,
      });
      break;
    }
    case "payment-reminder":
      html = sponsorPaymentReminderEmail({
        contactName: "Martha Nava",
        companyName: "Global Talk LLC",
        tierName: "Exhibitor Table",
        amountLabel: "$650",
        payUrl: `${base}/sponsor/status/demo-token`,
        hasLogo: true,
        reminderNumber: 1,
        siteUrl: base,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        dateLabel: "July 29, 2026",
        assetBase: base,
      });
      break;
    case "sponsor-team":
      html = sponsorTeamInviteEmail({
        contactName: "Jace Rivera",
        companyName: "Maya Bridge Language Services",
        tierName: "Exhibitor Table",
        ticketsIncluded: 1,
        teamUrl: `${base}/exhibitor/demo-team-token`,
        siteUrl: base,
        unsubscribeUrl: `${base}/api/sponsors/unsubscribe/demo-token`,
        dateLabel: "July 29, 2026",
        assetBase: base,
      });
      break;
    case "attendee":
      html = plainStandardInviteEmail({
        firstName: "Jordan",
        url: `${base}/register?code=JORDAN25`,
        inviteMessage: null,
        discountPercent: 25,
        inPersonOriginalCents: 21000,
        inPersonDiscountedCents: 15750,
        virtualOriginalCents: 10500,
        virtualDiscountedCents: 7875,
        oneDayOriginalCents: 6900,
        oneDayDiscountedCents: 5175,
        personalCode: "JORDAN25",
        mainSiteUrl: base,
        unsubscribeUrl: `${base}/api/attendees/unsubscribe/preview-token`,
      });
      break;
    case "returning-paid-inperson":
    case "returning-paid-virtual":
    case "returning-attempted":
    case "returning-lead": {
      const seg = template.replace("returning-", "");
      const { plainReturningInviteEmail } = await import("@/lib/mail-templates");
      html = plainReturningInviteEmail({
        firstName: "Lyan",
        url: `${base}/attend/preview-token`,
        inviteMessage: null,
        discountPercent: 25,
        inPersonOriginalCents: 21000,
        inPersonDiscountedCents: 15750,
        virtualOriginalCents: 10500,
        virtualDiscountedCents: 7875,
        oneDayOriginalCents: 6900,
        oneDayDiscountedCents: 5175,
        personalCode: "LYAN25",
        mainSiteUrl: `${base}/register`,
        learnMoreUrl: base,
        dateLabel: "July 15, 2026",
        assetBase: base,
        unsubscribeUrl: `${base}/api/attendees/unsubscribe/preview-token`,
        returning2024: seg.startsWith("paid") ? "paid" : (seg as "attempted" | "lead"),
        attended2024Mode: seg === "paid-inperson" ? "in-person" : seg === "paid-virtual" ? "virtual" : "virtual",
        primaryLanguages: "Spanish, English",
      });
      break;
    }
    // Student / former-student re-engagement note (plain personal email).
    case "attendee-student":
    case "attendee-former":
      html = plainCommunityInviteEmail({
        firstName: "Lyan",
        url: `${base}/attend/preview-token`,
        inviteMessage: null,
        discountPercent: 25,
        personalCode: "LYAN25",
        mainSiteUrl: `${base}/register`,
        learnMoreUrl: base,
        dateLabel: "July 15, 2026",
        assetBase: base,
        unsubscribeUrl: `${base}/api/attendees/unsubscribe/preview-token`,
        inPersonOriginalCents: 21000,
        inPersonDiscountedCents: 15750,
        virtualOriginalCents: 10500,
        virtualDiscountedCents: 7875,
        oneDayOriginalCents: 6900,
        oneDayDiscountedCents: 5175,
        relationship: template === "attendee-student" ? "student" : "former-student",
      });
      break;
    case "attendee-alumni":
      html = plainCommunityInviteEmail({
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
        oneDayOriginalCents: 6900,
        oneDayDiscountedCents: 5175,
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
