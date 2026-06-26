import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCompExhibitor } from "@/lib/sponsors";
import { confirmSponsorPaid } from "@/lib/sponsor-confirm";

// Public (token-gated) claim of a complimentary exhibitor table. No payment:
// marks the comped exhibitor confirmed and sends the confirmation email, the
// same idempotent path a real payment uses.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { token } = body || {};
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const sponsor = await prisma.sponsor.findUnique({ where: { applicationToken: token } });
  if (!sponsor) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (sponsor.paid) return NextResponse.json({ ok: true, alreadyClaimed: true });
  if (!isCompExhibitor(sponsor)) {
    return NextResponse.json({ error: "This table requires payment." }, { status: 400 });
  }

  const r = await confirmSponsorPaid(sponsor.id, { source: "comp_claim", sessionId: null });
  return NextResponse.json({ ok: r.ok, emailed: r.emailed });
}
