import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveLogoFromDataUrl } from "@/lib/sponsor-logo";

// Public (token-gated) save of exhibitor on-site details. Used on the pay page
// so applicants already awaiting payment can fill these in before checkout.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, registreeName, registreeEmail, dietary, accessibility, wantsLogo, logo } = body || {};
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (sponsor.tier !== "exhibitor") return NextResponse.json({ error: "Not an exhibitor application." }, { status: 400 });
  if (!registreeName?.trim()) return NextResponse.json({ error: "Tell us who will staff the table." }, { status: 400 });

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      registreeName: registreeName.trim(),
      registreeEmail: registreeEmail?.trim().toLowerCase() || null,
      dietary: dietary?.trim() || null,
      accessibility: accessibility?.trim() || null,
      wantsLogo: Boolean(wantsLogo),
      exhibitorDetailsAt: new Date(),
    },
  });
  if (wantsLogo && logo?.dataUrl) {
    await saveLogoFromDataUrl(sponsor.id, logo.dataUrl, logo?.name).catch((e) => console.error("[exhibitor-details] logo save failed", e));
  }
  await prisma.sponsorEvent.create({ data: { sponsorId: sponsor.id, type: "exhibitor_details_saved" } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
