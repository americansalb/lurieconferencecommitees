import { NextResponse } from "next/server";
import { ensureStandingCampaignCodes } from "@/lib/discounts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAttendeeInvite, buildFinishRegistrationNudge, attachmentsJsonFor } from "@/lib/attendees";

// Re-render every still-pending attendee email in the queue from the current
// templates. The queue freezes each email's HTML and subject at enqueue time,
// so anything queued before a template change would otherwise go out with
// the old design. Each row is rebuilt with the SAME kind of letter it was
// queued as: finish-registration nudge rows (batchId attendee-finish-nudge-*)
// re-render through the nudge builder, everything else through the invite
// builder — a refresh must never turn a reminder back into an invitation.
// Scheduled times and everything already sent are untouched; attachments are
// re-derived so NBCMI invites queued before the program-PDF change pick it up.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  await ensureStandingCampaignCodes().catch(() => {});

  const rows = await prisma.emailQueue.findMany({
    where: { recipientType: "attendee", status: "pending" },
    select: { id: true, recipientId: true, batchId: true },
  });

  let refreshed = 0;
  for (const row of rows) {
    if (!row.recipientId) continue;
    const a = await prisma.attendee.findUnique({ where: { id: row.recipientId } });
    if (!a) continue;
    if ((row.batchId || "").startsWith("attendee-finish-nudge")) {
      const { subject, html } = buildFinishRegistrationNudge({
        firstName: a.firstName,
        inviteToken: a.inviteToken,
        discountPercent: a.discountPercent,
        attendanceMode: a.attendanceMode,
        attendDay: a.attendDay,
        finalPriceCents: a.finalPriceCents,
      });
      await prisma.emailQueue.update({ where: { id: row.id }, data: { subject, html } });
    } else {
      const { subject, html } = buildAttendeeInvite({
        firstName: a.firstName,
        inviteToken: a.inviteToken,
        discountPercent: a.discountPercent,
        inviteMessage: a.inviteMessage,
        template: a.inviteTemplate,
        returning: { status: a.returning2024, mode: a.attended2024Mode, languages: a.primaryLanguages },
      });
      await prisma.emailQueue.update({ where: { id: row.id }, data: { subject, html, attachments: attachmentsJsonFor(a.inviteTemplate) } });
    }
    refreshed++;
  }

  return NextResponse.json({ ok: true, refreshed });
}
