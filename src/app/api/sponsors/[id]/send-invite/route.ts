import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueueSponsorInvite } from "@/lib/sponsor-invite";
import { appUrl } from "@/lib/presenters";

// Per-org "Queue invite" button on the dashboard: schedule (or re-schedule) the
// invitation to one sponsor into the shared paced Email Queue, which is the only
// path that actually delivers. Nothing sends immediately from here. The template
// is chosen by tier (food / ASL / comp / standard letter) inside the renderer.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const actorEmail = session.user.email || null;

  const sponsor = await prisma.sponsor.findUnique({ where: { id: params.id } });
  if (!sponsor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sponsor.unsubscribedAt) {
    return NextResponse.json({ ok: false, queued: false, error: "This organization has unsubscribed." }, { status: 409 });
  }

  try {
    await enqueueSponsorInvite(sponsor, appUrl(), { actorEmail });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.sponsorEvent
      .create({ data: { sponsorId: sponsor.id, type: "invite_queue_failed", meta: msg.slice(0, 300), actorEmail } })
      .catch(() => {});
    return NextResponse.json({ ok: false, queued: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, queued: true });
}
