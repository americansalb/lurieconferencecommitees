import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPublicBaseUrl } from "@/lib/sponsor-invite";
import { ambassadorInviteEmail } from "@/lib/mail-templates";
import { ambassadorRegion, ambassadorShareUrl, ambassadorSubject, ambassadorUnsubscribeUrl } from "@/lib/ambassadors";
import { appUrl } from "@/lib/presenters";

function letterDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago",
  });
}

// Re-render every still-pending ambassador letter from the current template,
// mirroring the sponsor/attendee refresh routes, so letters queued before a
// template change go out with the new design. Pending rows only.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const base = appUrl();
  try {
    assertPublicBaseUrl(base);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }

  const rows = await prisma.emailQueue.findMany({
    where: { recipientType: "ambassador", status: "pending" },
    select: { id: true, recipientId: true },
  });

  let refreshed = 0;
  for (const row of rows) {
    if (!row.recipientId) continue;
    const a = await prisma.ambassador.findUnique({ where: { id: row.recipientId } });
    if (!a || a.unsubscribedAt) continue;
    const html = ambassadorInviteEmail({
      contactName: a.contactName,
      orgName: a.orgName,
      note: a.note,
      code: a.code,
      shareUrl: ambassadorShareUrl(a.code, base),
      learnMoreUrl: base,
      unsubscribeUrl: ambassadorUnsubscribeUrl(a.token),
      dateLabel: letterDate(),
      region: ambassadorRegion(a.orgName, a.audience),
      assetBase: base,
    });
    await prisma.emailQueue.update({
      where: { id: row.id },
      data: { subject: ambassadorSubject(a.orgName), html },
    });
    refreshed++;
  }

  return NextResponse.json({ ok: true, refreshed });
}
