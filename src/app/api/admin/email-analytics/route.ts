import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  pickAlumniSubject, pickReturningSubject, pickStudentSubject,
  pickCmiSubject, pickChicagoSubject,
  ALUMNI_SUBJECT_VARIANTS, RETURNING_PAID_SUBJECT_VARIANTS,
  RETURNING_PAID_INPERSON_SUBJECT_VARIANTS, RETURNING_LEAD_SUBJECT_VARIANTS,
  STUDENT_SUBJECT_VARIANTS, CMI_SUBJECT_VARIANTS, CHICAGO_SUBJECT_VARIANTS,
} from "@/lib/subject-variants";
import { isCountedClick } from "@/lib/engagement";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

// Hour of day (0-23) in conference-local time, so "best send hour" means the
// hour the admin actually schedules in, not UTC.
const HOUR_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago", hour: "numeric", hour12: false,
});
function localHour(d: Date): number {
  const h = parseInt(HOUR_FMT.format(d), 10);
  return Number.isFinite(h) ? h % 24 : 0;
}
const DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
});

// Which subject-variant set a given attendee was assigned, mirroring exactly
// what buildAttendeeInvite() does at send time. Returns null for templates
// that don't rotate subjects (the plain standard invite).
function variantFor(a: { inviteTemplate: string; inviteToken: string; returning2024: string | null; attended2024Mode: string | null; affiliation: string | null }) {
  if (a.inviteTemplate === "returning") {
    const paid = a.returning2024 === "paid";
    const inPerson = a.attended2024Mode === "in-person";
    const set = paid ? (inPerson ? "returning-paid-inperson" : "returning-paid-virtual") : "returning-lead";
    return { set, id: pickReturningSubject("", a.inviteToken, paid, inPerson).id };
  }
  if (a.inviteTemplate === "alumni") {
    return { set: "alumni", id: pickAlumniSubject("", a.inviteToken).id };
  }
  if (a.inviteTemplate === "student" || a.inviteTemplate === "former-student") {
    return { set: "student", id: pickStudentSubject("", a.inviteToken).id };
  }
  if (a.inviteTemplate === "cmi") {
    return { set: "cmi", id: pickCmiSubject("", a.inviteToken).id };
  }
  if (a.inviteTemplate === "chicago") {
    // Keyed to the org exactly as the sender does, so attribution matches
    // which line actually went out (long/absent orgs draw org-free arms).
    return { set: "chicago", id: pickChicagoSubject(a.affiliation, a.inviteToken).id };
  }
  return null;
}

const VARIANT_SETS: { key: string; label: string; variants: { id: string; label: string; make: (f: string) => string }[] }[] = [
  { key: "returning-paid-inperson", label: "2024 attendees (came in person)", variants: RETURNING_PAID_INPERSON_SUBJECT_VARIANTS },
  { key: "returning-paid-virtual", label: "2024 attendees (watched online)", variants: RETURNING_PAID_SUBJECT_VARIANTS },
  { key: "returning-lead", label: "2024 interested, never attended", variants: RETURNING_LEAD_SUBJECT_VARIANTS },
  { key: "alumni", label: "AALB alumni", variants: ALUMNI_SUBJECT_VARIANTS },
  { key: "student", label: "Students & former students", variants: STUDENT_SUBJECT_VARIANTS },
  { key: "cmi", label: "NBCMI certified medical interpreters", variants: CMI_SUBJECT_VARIANTS },
  { key: "chicago", label: "Chicago direct invites", variants: CHICAGO_SUBJECT_VARIANTS },
];

// A person is "in the funnel" past the click once they've started registering.
function hasStarted(status: string, paid: boolean): boolean {
  return paid || status === "registered" || status === "rsvp_pending" || status === "confirmed";
}

// Full email analytics: the send→click→start→pay funnel with revenue, the same
// funnel broken out per audience segment, every subject-line A/B set, click
// rate by send hour, and list-health signals (unsubscribes, failures, and how
// many emails each person has actually received). All read-only.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin((session?.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  const DAY = 24 * 3600 * 1000;

  const [statusCounts, typeStatus, recentSent, failures, attendees, sponsorsRaw, sentQueueRows] = await Promise.all([
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
      select: {
        invitedAt: true, lastSentAt: true, viewedAt: true, paid: true, status: true,
        inviteTemplate: true, inviteToken: true, returning2024: true, attended2024Mode: true,
        finalPriceCents: true, unsubscribedAt: true, attendanceMode: true, affiliation: true,
      },
    }),
    prisma.sponsor.findMany({
      where: { mergedIntoId: null },
      select: {
        invitedAt: true, lastSentAt: true, paid: true, status: true, amountCents: true,
        events: {
          where: { type: { in: ["invite_viewed", "inkind_pledge_viewed", "email_clicked"] } },
          select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1,
        },
      },
    }),
    // Every send, for per-person frequency. recipientId is null on ad-hoc
    // sends, which simply don't count toward anyone's frequency.
    prisma.emailQueue.findMany({
      where: { status: "sent" },
      select: { recipientId: true, recipientType: true, sentAt: true },
    }),
  ]);

  const counts = statusCounts.reduce<Record<string, number>>((a, c) => ((a[c.status] = c._count._all), a), {});

  const sentTimes = sentQueueRows.map((r) => r.sentAt?.getTime() || 0);
  const sentWindow = (ms: number) => sentTimes.filter((t) => t >= now - ms).length;

  // ---- Daily volume + clicks earned by that day's sends -------------------
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) dayKeys.push(DAY_FMT.format(new Date(now - i * DAY)));
  const dayMap = new Map(dayKeys.map((k) => [k, { day: k, attendee: 0, sponsor: 0, other: 0, clicked: 0, paid: 0 }]));
  for (const r of recentSent) {
    if (!r.sentAt) continue;
    const bucket = dayMap.get(DAY_FMT.format(r.sentAt));
    if (!bucket) continue;
    if (r.recipientType === "attendee") bucket.attendee++;
    else if (r.recipientType === "sponsor") bucket.sponsor++;
    else bucket.other++;
  }

  // ---- Engagement (kept from the original, still the headline table) ------
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

  const attRows = attendees.map((a) => {
    const delivered = a.invitedAt || a.lastSentAt;
    const counted = isCountedClick(delivered, a.viewedAt) ? a.viewedAt : null;
    return {
      delivered: delivered ? new Date(delivered).getTime() : null,
      clickedAt: counted ? new Date(counted).getTime() : null,
    };
  });
  const spoRows = sponsorsRaw.map((s) => {
    const delivered = s.invitedAt || s.lastSentAt;
    const rawClick = s.events[0]?.createdAt || null;
    const counted = isCountedClick(delivered, rawClick) ? rawClick : null;
    return {
      delivered: delivered ? new Date(delivered).getTime() : null,
      clickedAt: counted ? new Date(counted).getTime() : null,
    };
  });

  const engagement = {
    attendees: engagementOf(attRows),
    sponsors: engagementOf(spoRows),
    combined: engagementOf([...attRows, ...spoRows]),
  };

  // ---- The funnel: emailed -> clicked -> started -> paid ------------------
  // Every stage counts only people we actually emailed, so a walk-up
  // registration can never be credited to the campaign.
  const emailedAttendees = attendees.filter((a) => a.invitedAt || a.lastSentAt);
  const attClicked = emailedAttendees.filter((a) => isCountedClick(a.invitedAt || a.lastSentAt, a.viewedAt));
  const attStarted = emailedAttendees.filter((a) => hasStarted(a.status, a.paid));
  const attPaid = emailedAttendees.filter((a) => a.paid);
  const attRevenue = attPaid.reduce((sum, a) => sum + (a.finalPriceCents || 0), 0);

  const emailedSponsors = sponsorsRaw.filter((s) => s.invitedAt || s.lastSentAt);
  const spoClicked = emailedSponsors.filter((s) => isCountedClick(s.invitedAt || s.lastSentAt, s.events[0]?.createdAt || null));
  const spoWon = emailedSponsors.filter((s) => s.paid || s.status === "confirmed");
  const spoRevenue = emailedSponsors.filter((s) => s.paid).reduce((sum, s) => sum + (s.amountCents || 0), 0);

  const funnel = {
    attendees: {
      emailed: emailedAttendees.length,
      clicked: attClicked.length,
      started: attStarted.length,
      paid: attPaid.length,
      revenueCents: attRevenue,
      clickRate: pct(attClicked.length, emailedAttendees.length),
      startRate: pct(attStarted.length, attClicked.length),
      payRate: pct(attPaid.length, attStarted.length),
      endToEnd: pct(attPaid.length, emailedAttendees.length),
    },
    sponsors: {
      emailed: emailedSponsors.length,
      clicked: spoClicked.length,
      won: spoWon.length,
      revenueCents: spoRevenue,
      clickRate: pct(spoClicked.length, emailedSponsors.length),
      endToEnd: pct(spoWon.length, emailedSponsors.length),
    },
    // Context: totals including people we never emailed.
    totalPaidAttendees: attendees.filter((a) => a.paid).length,
    totalAttendeeRevenueCents: attendees.filter((a) => a.paid).reduce((s, a) => s + (a.finalPriceCents || 0), 0),
  };

  // ---- Per-segment performance -------------------------------------------
  const SEGMENTS: { key: string; label: string; match: (a: (typeof attendees)[number]) => boolean }[] = [
    { key: "returning-paid-inperson", label: "2024 attendees (in person)", match: (a) => a.inviteTemplate === "returning" && a.returning2024 === "paid" && a.attended2024Mode === "in-person" },
    { key: "returning-paid-virtual", label: "2024 attendees (virtual)", match: (a) => a.inviteTemplate === "returning" && a.returning2024 === "paid" && a.attended2024Mode !== "in-person" },
    { key: "returning-attempted", label: "2024 started, never paid", match: (a) => a.inviteTemplate === "returning" && a.returning2024 === "attempted" },
    { key: "returning-lead", label: "2024 interested only", match: (a) => a.inviteTemplate === "returning" && a.returning2024 === "lead" },
    { key: "alumni", label: "AALB alumni", match: (a) => a.inviteTemplate === "alumni" },
    { key: "student", label: "AALB students", match: (a) => a.inviteTemplate === "student" },
    { key: "former-student", label: "Former AALB students", match: (a) => a.inviteTemplate === "former-student" },
    { key: "cmi", label: "NBCMI certified interpreters", match: (a) => a.inviteTemplate === "cmi" },
    { key: "chicago", label: "Chicago direct invites", match: (a) => a.inviteTemplate === "chicago" },
    { key: "standard", label: "Standard invite", match: (a) => a.inviteTemplate === "standard" },
  ];

  const segments = SEGMENTS.map((seg) => {
    const rows = emailedAttendees.filter(seg.match);
    const clicked = rows.filter((a) => isCountedClick(a.invitedAt || a.lastSentAt, a.viewedAt)).length;
    const started = rows.filter((a) => hasStarted(a.status, a.paid)).length;
    const paid = rows.filter((a) => a.paid).length;
    const unsubscribed = rows.filter((a) => a.unsubscribedAt).length;
    const revenueCents = rows.filter((a) => a.paid).reduce((s, a) => s + (a.finalPriceCents || 0), 0);
    return {
      key: seg.key, label: seg.label,
      emailed: rows.length, clicked, started, paid, unsubscribed, revenueCents,
      clickRate: pct(clicked, rows.length),
      payRate: pct(paid, rows.length),
      unsubRate: pct(unsubscribed, rows.length),
    };
  }).filter((s) => s.emailed > 0);

  // ---- Subject-line A/B, every set ----------------------------------------
  const abBySet = VARIANT_SETS.map((set) => {
    const rows = set.variants.map((v) => ({
      id: v.id, label: v.label, example: v.make(set.key === "chicago" ? "Rush University Medical Center" : "Alex"),
      sent: 0, clicked: 0, paid: 0, clickRate: 0,
    }));
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const a of emailedAttendees) {
      const v = variantFor(a);
      if (!v || v.set !== set.key) continue;
      const row = byId.get(v.id);
      if (!row) continue;
      row.sent++;
      if (isCountedClick(a.invitedAt || a.lastSentAt, a.viewedAt)) row.clicked++;
      if (a.paid) row.paid++;
    }
    for (const r of rows) r.clickRate = pct(r.clicked, r.sent);
    return { key: set.key, label: set.label, rows, sent: rows.reduce((s, r) => s + r.sent, 0) };
  }).filter((s) => s.sent > 0);

  // ---- Click rate by send hour (America/Chicago) --------------------------
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, sent: 0, clicked: 0, clickRate: 0 }));
  for (const a of emailedAttendees) {
    const d = a.invitedAt || a.lastSentAt;
    if (!d) continue;
    const bucket = hours[localHour(new Date(d))];
    bucket.sent++;
    if (isCountedClick(d, a.viewedAt)) bucket.clicked++;
  }
  for (const h of hours) h.clickRate = pct(h.clicked, h.sent);

  // ---- List health: how much mail each person has actually received -------
  // The number that matters for reputation and for not burning the list.
  const perPerson = new Map<string, { total: number; byDay: Map<string, number> }>();
  for (const r of sentQueueRows) {
    if (!r.recipientId || !r.sentAt) continue;
    const key = `${r.recipientType}:${r.recipientId}`;
    let rec = perPerson.get(key);
    if (!rec) { rec = { total: 0, byDay: new Map() }; perPerson.set(key, rec); }
    rec.total++;
    const dk = DAY_FMT.format(r.sentAt);
    rec.byDay.set(dk, (rec.byDay.get(dk) || 0) + 1);
  }
  const perPersonRows = Array.from(perPerson.values());
  const totals = perPersonRows.map((r) => r.total);
  const maxInOneDay = perPersonRows.map((r) => Math.max(0, ...Array.from(r.byDay.values())));
  const bucket = (arr: number[], test: (n: number) => boolean) => arr.filter(test).length;
  const frequency = {
    people: totals.length,
    avgPerPerson: totals.length ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10 : 0,
    medianPerPerson: median(totals),
    maxPerPerson: totals.length ? Math.max(...totals) : 0,
    distribution: [
      { label: "1 email", people: bucket(totals, (n) => n === 1) },
      { label: "2 emails", people: bucket(totals, (n) => n === 2) },
      { label: "3 emails", people: bucket(totals, (n) => n === 3) },
      { label: "4 emails", people: bucket(totals, (n) => n === 4) },
      { label: "5 or more", people: bucket(totals, (n) => n >= 5) },
    ],
    // Anyone who got more than one email in a single day is the deliverability
    // risk worth watching; two in a day reads as a blast, not an invitation.
    multiplePerDay: bucket(maxInOneDay, (n) => n >= 2),
    threePlusPerDay: bucket(maxInOneDay, (n) => n >= 3),
  };

  const attUnsub = attendees.filter((a) => a.unsubscribedAt).length;
  const health = {
    unsubscribed: attUnsub,
    unsubRate: pct(attUnsub, emailedAttendees.length),
    failed: counts.failed || 0,
    failRate: pct(counts.failed || 0, (counts.sent || 0) + (counts.failed || 0)),
    pending: counts.pending || 0,
  };

  // Legacy shapes kept so nothing else that reads this endpoint breaks.
  const conversion = {
    attendees: { sent: funnel.attendees.emailed, paid: funnel.attendees.paid, totalPaid: funnel.totalPaidAttendees, rate: Math.round(funnel.attendees.endToEnd) },
    sponsors: { sent: funnel.sponsors.emailed, paid: funnel.sponsors.won, totalPaid: sponsorsRaw.filter((s) => s.paid).length, rate: Math.round(funnel.sponsors.endToEnd) },
  };

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
    daily: dayKeys.map((k) => dayMap.get(k)!),
    engagement,
    funnel,
    segments,
    abBySet,
    hours,
    frequency,
    health,
    conversion,
    failures,
  });
}
