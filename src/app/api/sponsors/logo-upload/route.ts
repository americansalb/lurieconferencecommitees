import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveLogoFromDataUrl } from "@/lib/sponsor-logo";

// Public (token-gated) logo upload / replace. Lets a sponsor or exhibitor send
// a higher-resolution logo straight from their portal, including after paying,
// so the team never has to chase it over email and re-upload by hand.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token, logo } = body || {};
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!logo?.dataUrl) return NextResponse.json({ error: "No logo file provided." }, { status: 400 });

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  try {
    await saveLogoFromDataUrl(sponsor.id, logo.dataUrl, logo?.name);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save that logo." }, { status: 400 });
  }
  await prisma.sponsor.update({ where: { id: sponsor.id }, data: { wantsLogo: true } });
  await prisma.sponsorEvent.create({ data: { sponsorId: sponsor.id, type: "logo_uploaded" } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
