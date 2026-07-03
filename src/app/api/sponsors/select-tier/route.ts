import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { tierById, sponsorFromHeader, sponsorLetterReplyTo } from "@/lib/sponsors";
import { sponsorInKindPledgeEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Public endpoint: an invited sponsor picks (or changes) their level on
// /sponsor/invited/<token>. Authenticated only by knowledge of the token.
// Returns the updated sponsor; the client then either calls /checkout
// (paid tiers) or shows the in-kind confirmation (food donation).
export async function POST(req: Request) {
  const { token, tier, donateFoodInstead } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!tier) return NextResponse.json({ error: "Pick a sponsorship level" }, { status: 400 });

  const t = tierById(tier);
  if (!t) return NextResponse.json({ error: "Unknown tier" }, { status: 400 });

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  if (sponsor.paid) return NextResponse.json({ error: "Already paid" }, { status: 409 });

  const usesAlternative = t.id === "food" && donateFoodInstead === true;
  const amountCents = usesAlternative ? 0 : t.amountCents;

  const updated = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      tier: t.id,
      amountCents,
      donateFoodInstead: usesAlternative,
      status: usesAlternative ? "in_conversation" : sponsor.status,
      // Any checkout session created before this choice priced a different
      // tier; Stripe keeps such sessions payable for ~24h, so drop the
      // reference to keep a stale cheaper tab from confirming the new tier.
      stripeSessionId: null,
    },
  });
  await prisma.sponsorEvent.create({
    data: {
      sponsorId: sponsor.id,
      type: usesAlternative ? "tier_selected_food_in_kind" : "tier_selected",
      meta: t.id,
    },
  });

  // The landing page tells a food-in-kind sponsor "our team will follow up" —
  // make that true: notify the team and confirm to the sponsor, mirroring the
  // dedicated pledge funnel. Fire-and-forget; errors never block the flow.
  if (usesAlternative) {
    sendMail({
      to: updated.contactEmail,
      subject: "Thank you for feeding the 2026 Lurie Children's & AALB Conference",
      html: sponsorInKindPledgeEmail({
        kind: "food",
        contactName: updated.contactName,
        companyName: updated.companyName,
        provide: "",
        arrangementLabel: "Donating the food",
        assetBase: appUrl(),
      }),
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: updated.additionalEmails,
    }).catch((e) => console.error("[select-tier] in-kind confirmation email failed", e));
    sendMail({
      to: "contact@aalb.org",
      subject: `Food pledge: ${updated.companyName}`,
      html: `<p>${escapeHtml(updated.companyName)} (${escapeHtml(updated.contactName)}, ${escapeHtml(updated.contactEmail)}) chose to donate food in kind from their invitation page. Follow up to coordinate menu, quantities, and logistics.</p>`,
      from: sponsorFromHeader(),
    }).catch(() => { /* non-fatal */ });
  }

  return NextResponse.json({
    ok: true,
    tier: t.id,
    requiresPayment: amountCents > 0,
    donatesFoodInstead: usesAlternative,
    sponsor: updated,
  });
}
