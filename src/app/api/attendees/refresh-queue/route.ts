import { NextResponse } from "next/server";
import { ensureStandingCampaignCodes } from "@/lib/discounts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAttendeeInvite } from "@/lib/attendees";

// Re-render every still-pending attendee invite in the queue from the current
// templates. The queue freezes each email's HTML and subject at enqueue time,
// so any invites queued before a template change would otherwise go out with
// the old design. This rebuilds subject + HTML in place for pending rows only;
// scheduled times and everything already sent are untouched.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  await ensureStandingCampaignCodes().catch(() => {});

  const rows = await prisma.emailQueue.findMany({
    where: { recipientType: "attendee", status: "pending" },
    select: { id: true, recipientId: true },
  });

  let refreshed = 0;
  for (const row of rows) {
    if (!row.recipientId) continue;
    const a = await prisma.attendee.findUnique({ where: { id: row.recipientId } });
    if (!a) continue;
    const { subject, html } = buildAttendeeInvite({
      firstName: a.firstName,
      inviteToken: a.inviteToken,
      discountPercent: a.discountPercent,
      inviteMessage: a.inviteMessage,
      template: a.inviteTemplate,
      returning: { status: a.returning2024, mode: a.attended2024Mode, languages: a.primaryLanguages },
    });
    await prisma.emailQueue.update({ where: { id: row.id }, data: { subject, html } });
    refreshed++;
  }

  return NextResponse.json({ ok: true, refreshed });
}
