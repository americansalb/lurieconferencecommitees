import { NextResponse } from "next/server";
import {
  sponsorInviteEmail,
  proposalCallEmail,
  bookingInviteEmail,
  bookingConfirmedInviteeEmail,
} from "@/lib/mail-templates";

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
    default:
      return new NextResponse("Unknown template", { status: 404 });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
