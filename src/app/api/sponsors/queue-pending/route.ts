import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPolicy, planSendTimes } from "@/lib/email-queue";
import { renderSponsorInvite } from "@/lib/sponsor-invite";
import { appUrl } from "@/lib/presenters";

// Push every "Pending invite" prospect into the paced server queue so the Render
// cron sends them in the background, with no page kept open. Each prospect gets
// the right email for its tier (food / ASL / comp / standard letter). Admin only.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const prospects = await prisma.sponsor.findMany({
    where: { status: "prospect", mergedIntoId: null, unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!prospects.length) return NextResponse.json({ ok: true, queued: 0 });

  const policy = await getPolicy();
  const times = await planSendTimes(prospects.length, policy);
  const batchId = `sponsor-queue-${Date.now()}`;
  const base = appUrl();
  let queued = 0;

  for (let i = 0; i < prospects.length; i++) {
    const s = prospects[i];
    const { subject, html } = renderSponsorInvite(s, base);

    await prisma.emailQueue.create({
      data: { batchId, recipientType: "sponsor", recipientId: s.id, to: s.contactEmail, subject, html, scheduledFor: times[i], status: "pending" },
    });
    await prisma.sponsor.update({ where: { id: s.id }, data: { status: "queued" } });
    await prisma.sponsorEvent.create({ data: { sponsorId: s.id, type: "added_to_queue", actorEmail: session?.user?.email || null } }).catch(() => {});
    queued++;
  }

  return NextResponse.json({ ok: true, queued });
}
