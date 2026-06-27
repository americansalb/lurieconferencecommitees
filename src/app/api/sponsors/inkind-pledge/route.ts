import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { sponsorFromHeader, sponsorLetterReplyTo } from "@/lib/sponsors";
import { sponsorInKindPledgeEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/presenters";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

const ARRANGEMENTS = {
  food: {
    donate: "Donating the food",
    partial: "Donating part, we purchase the rest",
    discuss: "Would like to discuss the options",
  },
  asl: {
    donate: "Donating the interpreting",
    partial: "Donating some hours, we cover the rest",
    discuss: "Would like to discuss the options",
  },
} as const;

// Public (token-gated) in-kind sponsor pledge from the funnel. A restaurant
// (food) or interpreting team (asl) commits to providing services in kind,
// which marks them a tracked sponsor (no money owed) and sends a warm
// confirmation. The kind is derived from the sponsor's tier. Both the contact
// and any merged co-applicants are notified.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, provide, servings, arrangement, contactName, contactEmail, contactPhone } = body || {};
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Pledge link not found." }, { status: 404 });

  const kind: "food" | "asl" = sponsor.tier === "asl" ? "asl" : "food";

  const provideText = String(provide || "").trim();
  if (!provideText) return NextResponse.json({ error: "Please tell us what you could provide." }, { status: 400 });

  const arrangementLabel = ARRANGEMENTS[kind][arrangement as keyof (typeof ARRANGEMENTS)["food"]] || ARRANGEMENTS[kind].discuss;
  const servingsText = String(servings || "").trim();
  const noun = kind === "asl" ? "ASL pledge" : "Food pledge";
  const summary = [
    `${noun}: ${provideText}`,
    servingsText ? `Est: ${servingsText}` : "",
    `Arrangement: ${arrangementLabel}`,
  ].filter(Boolean).join(" · ");

  const newName = String(contactName || "").trim();
  const newEmail = String(contactEmail || "").trim().toLowerCase();
  const newPhone = String(contactPhone || "").trim();

  const updated = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      tier: kind, // "food" or "asl"
      donateFoodInstead: kind === "food",
      amountCents: 0, // in-kind donation, no money owed
      status: sponsor.status === "paid" || sponsor.status === "confirmed" ? sponsor.status : "in_conversation",
      message: summary,
      contactName: newName || sponsor.contactName,
      contactEmail: isEmail(newEmail) ? newEmail : sponsor.contactEmail,
      contactPhone: newPhone || sponsor.contactPhone,
    },
  });
  await prisma.sponsorEvent.create({
    data: { sponsorId: sponsor.id, type: "inkind_pledged", meta: summary.slice(0, 480) },
  }).catch(() => {});

  try {
    await sendMail({
      to: updated.contactEmail,
      subject: kind === "asl"
        ? "Thank you for interpreting the 2026 Lurie Children's & AALB Conference"
        : "Thank you for feeding the 2026 Lurie Children's & AALB Conference",
      html: sponsorInKindPledgeEmail({
        kind,
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
    console.error("[inkind-pledge] confirmation email failed", e);
  }

  try {
    await sendMail({
      to: "contact@aalb.org",
      subject: `${kind === "asl" ? "ASL" : "Food"} pledge: ${updated.companyName}`,
      html: `<p>${updated.companyName} (${updated.contactName}, ${updated.contactEmail}${updated.contactPhone ? `, ${updated.contactPhone}` : ""}) pledged in kind.</p><p><strong>${summary}</strong></p>`,
      from: sponsorFromHeader(),
    });
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true, kind });
}
