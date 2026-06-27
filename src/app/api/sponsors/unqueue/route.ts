import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Take the "Send in background" queue apart. Flips every queued sponsor back to
// "prospect" (so their per-row Send invite button returns) and cancels the
// still-pending emailQueue rows that were created for them, so the background
// cron stops sending. Anything already sent is left alone. Admin only.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids)
    ? (body.ids as unknown[]).filter((x): x is string => typeof x === "string")
    : null;

  const queued = await prisma.sponsor.findMany({
    where: ids && ids.length ? { id: { in: ids } } : { status: "queued" },
    select: { id: true },
  });
  const sponsorIds = queued.map((s) => s.id);
  if (!sponsorIds.length) return NextResponse.json({ ok: true, unqueued: 0, canceled: 0 });

  // Cancel only the still-pending sends; never touch ones already sent.
  const canceled = await prisma.emailQueue.updateMany({
    where: { recipientType: "sponsor", recipientId: { in: sponsorIds }, status: "pending" },
    data: { status: "canceled" },
  });

  await prisma.sponsor.updateMany({
    where: { id: { in: sponsorIds }, status: "queued" },
    data: { status: "prospect" },
  });

  await prisma.sponsorEvent.createMany({
    data: sponsorIds.map((id) => ({ sponsorId: id, type: "removed_from_queue", actorEmail: session?.user?.email || null })),
  }).catch(() => {});

  return NextResponse.json({ ok: true, unqueued: sponsorIds.length, canceled: canceled.count });
}
