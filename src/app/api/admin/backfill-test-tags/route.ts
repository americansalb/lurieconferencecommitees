import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// One-time (idempotent) cleanup: delivery-test emails created before the
// isTest / "test" recipientType tagging existed are still labelled as attendee
// traffic. Re-tag every row in the delivery-test batch and flag its attendee
// record so historical tests drop out of the real metrics too. Safe to run any
// number of times — once everything is tagged it's a no-op.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const rows = await prisma.emailQueue.findMany({
    where: { batchId: "attendee-delivery-test" },
    select: { recipientId: true },
  });
  const attendeeIds = Array.from(new Set(rows.map((r) => r.recipientId).filter((x): x is string => !!x)));

  const [q, a] = await Promise.all([
    prisma.emailQueue.updateMany({
      where: { batchId: "attendee-delivery-test", recipientType: { not: "test" } },
      data: { recipientType: "test" },
    }),
    attendeeIds.length
      ? prisma.attendee.updateMany({ where: { id: { in: attendeeIds }, isTest: false }, data: { isTest: true } })
      : Promise.resolve({ count: 0 }),
  ]);

  return NextResponse.json({ ok: true, retaggedQueue: q.count, retaggedAttendees: a.count });
}
