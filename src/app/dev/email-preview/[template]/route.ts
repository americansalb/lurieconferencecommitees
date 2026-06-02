import { NextResponse } from "next/server";
import {
  sponsorInviteEmail,
  proposalCallEmail,
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
      });
      break;
    case "cfp-general":
      html = proposalCallEmail({
        variant: "general",
        submitUrl: `${base}/proposal`,
        recipientFirstName: null,
      });
      break;
    case "cfp-healthcare":
      html = proposalCallEmail({
        variant: "healthcare",
        submitUrl: `${base}/proposal`,
        recipientFirstName: null,
      });
      break;
    default:
      return new NextResponse("Unknown template", { status: 404 });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
