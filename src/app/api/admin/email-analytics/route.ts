import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickAlumniSubject, ALUMNI_SUBJECT_VARIANTS } from "@/lib/subject-variants";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Aggregated email analytics: send volume, deliverability/engagement (sent vs
// clicked, with "delivered" = sent since we have no SMTP receipt), conversion,
// the alumni subject A/B, and recent failures. All read-only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  const DAY = 24 * 3600 * 1000;

  const [statusCounts, typeStatus, recentSent, failures, attendees, sponsorsRaw] = await Promise.all([
    prisma.emailQueue.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.emailQueue.groupBy({ by: ["recipientType", "status"], _count: { _all: true } }),
    prisma.emailQueue.findMany({
      where: { status: "sent", sentAt: { gte: new Date(now - 14 * DAY) } },
      select: { sentAt: true, recipientType: true },
    }),
    prisma.emailQueue.findMany({
      where: { status: "failed" },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: { to: true, subject: true, lastError: true, recipientType: true, attempts: true, scheduledFor: true },
    }),
    prisma.attendee.findMany({
      where: { isTest: false },
      select: { invitedAt: true, lastSentAt: true, viewedAt: true, paid: true, status: true, inviteTemplate: true, inviteToken: true },
    }),
    prisma.sponsor.findMany({
      where: { mergedIntoId: null },
      select: {
        invitedAt: true, lastSentAt: true, paid: true, status: true,
        events: {
          where: { type: { in: ["invite_viewed", "inkind_pledge_viewed", "email_clicked"] } },
          select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1,
        },
      },
    }),
  ]);

  const counts = statusCounts.reduce<Record<string, number>>((a, c) => ((a[c.status] = c._count._all), a), {});

  // Sent-volume windows.
  const sentRows = await prisma.emailQueue.findMany({ where: { status: "sent" }, select: { sentAt: true } });
  const sentTimes = sentRows.map((r) => r.sentAt?.getTime() || 0);
  const sentWindow = (ms: number) => sentTimes.filter((t) => t >= now - ms).length;

  // Daily volume (last 14 days), split by audience.
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) dayKeys.push(new Date(now - i * DAY).toISOString().slice(0, 10));
  const dayMap = new Map(dayKeys.map((k) => [k, { day: k, attendee: 0, sponsor: 0, other: 0 }]));
  for (const r of recentSent) {
    if (!r.sentAt) continue;
    const k = r.sentAt.toISOString().slice(0, 10);
    const bucket = dayMap.get(k);
    if (!bucket) continue;
    if (r.recipientType === "attendee") bucket.attendee++;
    else if (r.recipientType === "sponsor") bucket.sponsor++;
    else bucket.other++;
  }
  const daily = dayKeys.map((k) => dayMap.get(k)!);

  // Engagement helper.
  function engagementOf(rows: { delivered: number | null; clickedAt: number | null }[]) {
    const sent = rows.filter((r) => r.delivered != null);
    const clicked = rows.filter((r) => r.clickedAt != null);
    const lat = clicked
      .map((r) => (r.delivered != null && r.clickedAt != null ? r.clickedAt - r.delivered : NaN))
      .filter((x) => Number.isFinite(x) && x >= 0);
    return {
      delivered: sent.length,
      clicked: clicked.length,
      rate: sent.length ? Math.round((clicked.length / sent.length) * 100) : 0,
      medianMs: median(lat),
    };
  }

  const attRows = attendees.map((a) => ({
    delivered: (a.invitedAt || a.lastSentAt) ? new Date(a.invitedAt || a.lastSentAt!).getTime() : null,
    clickedAt: a.viewedAt ? new Date(a.viewedAt).getTime() : null,
  }));
  const spoRows = sponsorsRaw.map((s) => ({
    delivered: (s.invitedAt || s.lastSentAt) ? new Date(s.invitedAt || s.lastSentAt!).getTime() : null,
    clickedAt: s.events[0]?.createdAt ? new Date(s.events[0].createdAt).getTime() : null,
  }));

  const engagement = {
    attendees: engagementOf(attRows),
    sponsors: engagementOf(spoRows),
    combined: engagementOf([...attRows, ...spoRows]),
  };

  // Conversion: of those we emailed, how many paid.
  const attSent = attendees.filter((a) => a.invitedAt || a.lastSentAt);
  const attPaid = attendees.filter((a) => a.paid).length;
  const spoSent = sponsorsRaw.filter((s) => s.invitedAt || s.lastSentAt);
  const spoPaid = sponsorsRaw.filter((s) => s.paid).length;
  const conversion = {
    attendees: { sent: attSent.length, paid: attPaid, rate: attSent.length ? Math.round((attPaid / attSent.length) * 100) : 0 },
    sponsors: { sent: spoSent.length, paid: spoPaid, rate: spoSent.length ? Math.round((spoPaid / spoSent.length) * 100) : 0 },
  };

  // Alumni subject A/B.
  const abMap = new Map(ALUMNI_SUBJECT_VARIANTS.map((v) => [v.id, { id: v.id, label: v.label, example: v.make("Alex"), sent: 0, clicked: 0 }]));
  for (const a of attendees) {
    if (a.inviteTemplate !== "alumni") continue;
    if (!(a.invitedAt || a.lastSentAt)) continue;
    const id = pickAlumniSubject("", a.inviteToken).id;
    const r = abMap.get(id);
    if (!r) continue;
    r.sent++;
    if (a.viewedAt) r.clicked++;
  }
  const ab = Array.from(abMap.values());

  // Sent volume by audience (sent rows only), for the split summary.
  const sentByType: Record<string, number> = {};
  for (const t of typeStatus) {
    if (t.status !== "sent") continue;
    sentByType[t.recipientType] = (sentByType[t.recipientType] || 0) + t._count._all;
  }

  return NextResponse.json({
    counts,
    sent: {
      total: sentTimes.length,
      last24h: sentWindow(DAY),
      last7d: sentWindow(7 * DAY),
      last30d: sentWindow(30 * DAY),
      byType: sentByType,
    },
    daily,
    engagement,
    conversion,
    ab,
    failures,
  });
}
