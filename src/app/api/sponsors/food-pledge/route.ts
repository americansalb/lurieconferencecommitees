import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sponsorFromHeader, sponsorLetterReplyTo } from "@/lib/sponsors";
import { sponsorFoodPledgeEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

const ARRANGEMENTS: Record<string, string> = {
  donate: "Donating the food",
  partial: "Donating part, we purchase the rest",
  discuss: "Would like to discuss the options",
};

// Public (token-gated) food-sponsor pledge from the funnel. No payment: a
// restaurant commits to providing plant-based food in kind, which marks them a
// tracked Food Sponsor (donation in kind) and sends a warm confirmation. Both
// the contact and any merged co-applicants are notified.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, provide, servings, arrangement, contactName, contactEmail, contactPhone } = body || {};
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Pledge link not found." }, { status: 404 });

  const provideText = String(provide || "").trim();
  if (!provideText) return NextResponse.json({ error: "Please tell us what you could provide." }, { status: 400 });

  const arrangementLabel = ARRANGEMENTS[String(arrangement)] || ARRANGEMENTS.discuss;
  const servingsText = String(servings || "").trim();
  const summary = [
    `Food pledge: ${provideText}`,
    servingsText ? `Est. servings: ${servingsText}` : "",
    `Arrangement: ${arrangementLabel}`,
  ].filter(Boolean).join(" · ");

  const newName = String(contactName || "").trim();
  const newEmail = String(contactEmail || "").trim().toLowerCase();
  const newPhone = String(contactPhone || "").trim();

  const updated = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      // In-kind food donation: a tracked sponsor, no money owed.
      tier: "food",
      donateFoodInstead: true,
      amountCents: 0,
      // Move into the active pipeline so the team follows up.
      status: sponsor.status === "paid" || sponsor.status === "confirmed" ? sponsor.status : "in_conversation",
      message: summary,
      contactName: newName || sponsor.contactName,
      contactEmail: isEmail(newEmail) ? newEmail : sponsor.contactEmail,
      contactPhone: newPhone || sponsor.contactPhone,
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "food_pledged", meta: summary.slice(0, 480) },
  }).catch(() => {});

  // Confirm to the restaurant (CC any merged co-applicants).
  try {
    await sendMail({
      to: updated.contactEmail,
      subject: `Thank you for feeding the 2026 Lurie Children's & AALB Conference`,
      html: sponsorFoodPledgeEmail({
        contactName: updated.contactName,
        companyName: updated.companyName,
        provide: provideText,
        arrangementLabel,
        assetBase: appUrl(),
      }),
      from: sponsorFromHeader(),
      replyTo: sponsorLetterReplyTo(),
      cc: updated.additionalEmails,
    });
  } catch (e) {
    console.error("[food-pledge] confirmation email failed", e);
  }

  // Notify the team so a real human follows up.
  try {
    await sendMail({
      to: "contact@aalb.org",
      subject: `Food pledge: ${updated.companyName}`,
      html: `<p>${updated.companyName} (${updated.contactName}, ${updated.contactEmail}${updated.contactPhone ? `, ${updated.contactPhone}` : ""}) pledged food.</p><p><strong>${summary}</strong></p>`,
      from: sponsorFromHeader(),
    });
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true });
}
