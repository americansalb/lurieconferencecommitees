import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueSponsorInvite } from "@/lib/sponsor-invite";
import { appUrl } from "@/lib/presenters";

// Per-org "Queue + 20% off" button: the same invitation letter, but with the
// 20% VIP courtesy discount that auto-applies at checkout, scheduled into the
// shared paced Email Queue (nothing sends immediately from here). For the
// hand-picked prospects you want to give the deal. Admin only.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const actorEmail = session.user.email || null;

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sponsor.unsubscribedAt) {
    return NextResponse.json({ ok: false, queued: false, error: "This organization has unsubscribed." }, { status: 409 });
  }
  // The 20% courtesy is for paid sponsorships. Food/ASL sponsors are asked to
  // donate in kind, so a discount is meaningless; use Queue invite instead.
  if (sponsor.tier === "food" || sponsor.tier === "asl") {
    return NextResponse.json({ ok: false, queued: false, error: "The 20% offer does not apply to in-kind food or ASL sponsors. Use Queue invite instead." }, { status: 400 });
  }

  // VIP courtesy: 20% off any paid level, including the exhibitor table. Only a
  // complimentary (already-free) table gets no discount. enqueueSponsorInvite
  // persists this on the sponsor so checkout applies it automatically.
  const discountPercent = (sponsor.tier === "exhibitor" && sponsor.amountCents <= 0) ? null : 20;

  try {
    await enqueueSponsorInvite(sponsor, appUrl(), { discountPercent, actorEmail });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "letter_queue_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, queued: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, queued: true, discountPercent });
}
