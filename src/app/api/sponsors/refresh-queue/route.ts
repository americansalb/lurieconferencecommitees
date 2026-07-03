import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderSponsorInvite, assertPublicBaseUrl } from "@/lib/sponsor-invite";
import { appUrl } from "@/lib/presenters";

// Re-render every still-pending sponsor invite in the queue from the current
// templates, so invites queued before a template change go out with the new
// design. Pending rows only; scheduled times and sent rows are untouched.
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "developer") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const rows = await prisma.emailQueue.findMany({
    where: { recipientType: "sponsor", status: "pending" },
    select: { id: true, recipientId: true },
  });

  const base = appUrl();
  try {
    assertPublicBaseUrl(base);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
  let refreshed = 0;
  for (const row of rows) {
    if (!row.recipientId) continue;
    const s = await prisma.sponsor.findUnique({ where: { id: row.recipientId } });
    if (!s || s.unsubscribedAt) continue;
    const { subject, html } = renderSponsorInvite(s, base);
    await prisma.emailQueue.update({ where: { id: row.id }, data: { subject, html } });
    refreshed++;
  }

  return NextResponse.json({ ok: true, refreshed });
}
