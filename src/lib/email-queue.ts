import { prisma } from "./db";
import { sendMail } from "./mail";
import { attendeeFromHeader, attendeeReplyTo, attendeeBcc, attendeeUnsubHeaders } from "./attendees";
import { sponsorFromHeader, sponsorLetterReplyTo, sponsorUnsubHeaders } from "./sponsors";

// Default sending policy. Tunable via SystemSetting keys with the same names.
export const DEFAULT_POLICY = {
  maxPerHour: 10,
  maxPerDay: 60,
  minGapSeconds: 60,
  maxGapSeconds: 300,
  sendStartHour: 9,    // local hour, sendTimezone
  sendEndHour: 17,
  sendDays: [1, 2, 3, 4, 5], // Mon..Fri (0 = Sun)
  sendTimezone: "America/Chicago",
};

export type SendPolicy = typeof DEFAULT_POLICY;

export async function getPolicy(): Promise<SendPolicy> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: ["email.policy"] } },
  });
  const raw = rows.find((r) => r.key === "email.policy")?.value;
  if (!raw) return DEFAULT_POLICY;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_POLICY, ...parsed };
  } catch {
    return DEFAULT_POLICY;
  }
}

// Validate + persist policy changes from the admin queue controls. Each field is
// clamped to a sane range and merged onto the current policy.
export async function savePolicy(input: Partial<SendPolicy>): Promise<SendPolicy> {
  const current = await getPolicy();
  const merged: SendPolicy = { ...current };
  const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
  };
  if (input.maxPerHour !== undefined) merged.maxPerHour = clampInt(input.maxPerHour, 1, 100000, current.maxPerHour);
  if (input.maxPerDay !== undefined) merged.maxPerDay = clampInt(input.maxPerDay, 1, 1000000, current.maxPerDay);
  if (input.minGapSeconds !== undefined) merged.minGapSeconds = clampInt(input.minGapSeconds, 0, 86400, current.minGapSeconds);
  if (input.maxGapSeconds !== undefined) merged.maxGapSeconds = clampInt(input.maxGapSeconds, merged.minGapSeconds, 86400, current.maxGapSeconds);
  if (input.sendStartHour !== undefined) merged.sendStartHour = clampInt(input.sendStartHour, 0, 23, current.sendStartHour);
  if (input.sendEndHour !== undefined) merged.sendEndHour = clampInt(input.sendEndHour, merged.sendStartHour + 1, 24, current.sendEndHour);
  if (Array.isArray(input.sendDays)) {
    const days = Array.from(new Set(input.sendDays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)));
    if (days.length) merged.sendDays = days.sort();
  }
  if (typeof input.sendTimezone === "string" && input.sendTimezone.trim()) merged.sendTimezone = input.sendTimezone.trim();

  await prisma.systemSetting.upsert({
    where: { key: "email.policy" },
    create: { key: "email.policy", value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });
  return merged;
}

export async function isPaused(): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: "email.paused" },
  });
  return row?.value === "true";
}

export async function setPaused(paused: boolean) {
  await prisma.systemSetting.upsert({
    where: { key: "email.paused" },
    create: { key: "email.paused", value: paused ? "true" : "false" },
    update: { value: paused ? "true" : "false" },
  });
}

// Given a desired UTC moment, returns the next moment that falls within the
// configured business-hours window in the policy's timezone.
function clampToBusinessHours(when: Date, policy: SendPolicy): Date {
  const tz = policy.sendTimezone || "America/Chicago";
  // Move forward in 1-hour steps until we land in a valid window.
  // (Brute force, but bounded; never iterates past one week.)
  let cursor = new Date(when.getTime());
  for (let i = 0; i < 24 * 7; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(cursor);
    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const hourStr = parts.find((p) => p.type === "hour")?.value || "0";
    const hour = parseInt(hourStr, 10) % 24;
    const wkMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayNum = wkMap[weekday] ?? 0;

    const okDay = policy.sendDays.includes(dayNum);
    const okHour = hour >= policy.sendStartHour && hour < policy.sendEndHour;
    if (okDay && okHour) return cursor;

    // Jump forward minimally to next candidate hour.
    cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
  }
  return cursor;
}

// Computes a fresh send schedule for `count` new queue rows, anchored on the
// latest currently-scheduled item (or now) and respecting per-hour/per-day caps.
export async function planSendTimes(count: number, policy: SendPolicy): Promise<Date[]> {
  if (count <= 0) return [];

  // Anchor on the latest currently-scheduled pending item, or now.
  const latest = await prisma.emailQueue.findFirst({
    where: { status: { in: ["pending", "sending"] } },
    orderBy: { scheduledFor: "desc" },
    select: { scheduledFor: true },
  });
  let cursor = latest?.scheduledFor
    ? new Date(Math.max(latest.scheduledFor.getTime(), Date.now()))
    : new Date();
  cursor = clampToBusinessHours(cursor, policy);

  // Per-hour and per-day caps tracked by histogramming planned times.
  const hourBuckets = new Map<string, number>();
  const dayBuckets = new Map<string, number>();
  // Seed buckets with already-scheduled items so caps include them.
  const upcoming = await prisma.emailQueue.findMany({
    where: { status: { in: ["pending", "sending"] }, scheduledFor: { gte: new Date(Date.now() - 2 * 24 * 3600 * 1000) } },
    select: { scheduledFor: true },
  });
  for (const u of upcoming) {
    bumpBuckets(u.scheduledFor, hourBuckets, dayBuckets);
  }

  const results: Date[] = [];
  for (let i = 0; i < count; i++) {
    // Jitter between min/max gap.
    const gapSec = policy.minGapSeconds + Math.random() * (policy.maxGapSeconds - policy.minGapSeconds);
    cursor = new Date(cursor.getTime() + gapSec * 1000);
    cursor = clampToBusinessHours(cursor, policy);

    // Enforce caps; advance cursor until allowed.
    let safety = 0;
    while (safety++ < 24 * 7) {
      const hk = hourKey(cursor);
      const dk = dayKey(cursor);
      const hUsed = hourBuckets.get(hk) || 0;
      const dUsed = dayBuckets.get(dk) || 0;
      if (hUsed < policy.maxPerHour && dUsed < policy.maxPerDay) break;
      // Jump to next hour or next day boundary as appropriate.
      const jumpHours = dUsed >= policy.maxPerDay ? 24 : 1;
      cursor = new Date(cursor.getTime() + jumpHours * 60 * 60 * 1000);
      cursor = clampToBusinessHours(cursor, policy);
    }

    bumpBuckets(cursor, hourBuckets, dayBuckets);
    results.push(new Date(cursor.getTime()));
  }
  return results;
}

// The honest "next send" moment. A backed-up queue has items whose scheduledFor
// is already in the past, so showing that raw time reads as "the next send is in
// the past." What actually gates the next release is: the paced gap since the
// last send, the rolling hourly/daily caps, and the business-hours window. This
// returns the earliest a message can really leave, plus WHY it waits, so the UI
// can say "Due now" / "next paced slot" / "outside send window" honestly.
export async function estimateNextSend(): Promise<{ at: string | null; reason: string }> {
  if (await isPaused()) return { at: null, reason: "paused" };
  const policy = await getPolicy();
  const now = Date.now();

  const earliest = await prisma.emailQueue.findFirst({
    where: { status: "pending" },
    orderBy: { scheduledFor: "asc" },
    select: { scheduledFor: true },
  });
  if (!earliest) return { at: null, reason: "empty" };

  const effGapMs = Math.max(policy.minGapSeconds, Math.ceil(3600 / Math.max(1, policy.maxPerHour))) * 1000;
  const [hourWin, dayWin] = await Promise.all([
    prisma.emailQueue.findMany({ where: { status: "sent", sentAt: { gte: new Date(now - 3600_000) } }, orderBy: { sentAt: "asc" }, select: { sentAt: true } }),
    prisma.emailQueue.findMany({ where: { status: "sent", sentAt: { gte: new Date(now - 24 * 3600_000) } }, orderBy: { sentAt: "asc" }, select: { sentAt: true } }),
  ]);

  // Start from "now, or the item's own scheduled time if that's still ahead."
  let candidate = Math.max(now, earliest.scheduledFor.getTime());
  let reason = earliest.scheduledFor.getTime() > now ? "scheduled" : "due";

  // Paced gap since the last delivery.
  const lastSent = dayWin.length ? dayWin[dayWin.length - 1].sentAt : null;
  if (lastSent) {
    const gapReady = lastSent.getTime() + effGapMs;
    if (gapReady > candidate) { candidate = gapReady; reason = "pacing"; }
  }
  // Rolling caps: if we're at the ceiling, the next slot opens when the oldest
  // send in the window ages out.
  if (hourWin.length >= policy.maxPerHour && hourWin[0].sentAt) {
    const freeAt = hourWin[0].sentAt.getTime() + 3600_000;
    if (freeAt > candidate) { candidate = freeAt; reason = "hourlyCap"; }
  }
  if (dayWin.length >= policy.maxPerDay && dayWin[0].sentAt) {
    const freeAt = dayWin[0].sentAt.getTime() + 24 * 3600_000;
    if (freeAt > candidate) { candidate = freeAt; reason = "dailyCap"; }
  }
  // Finally, roll forward into the next business-hours window if needed.
  const clamped = clampToBusinessHours(new Date(candidate), policy);
  if (clamped.getTime() > candidate) { candidate = clamped.getTime(); reason = "window"; }

  return { at: new Date(candidate).toISOString(), reason };
}

// Drains due items from the email queue: claims each atomically, sends via
// Resend with the right envelope, advances the recipient, and retries or gives
// up on failure. Shared by the cron(s) so queued invites actually go out.
export async function runEmailQueue(): Promise<{ processed: number; sent: number; failed: number; paused?: boolean; throttled?: boolean }> {
  if (await isPaused()) return { processed: 0, sent: 0, failed: 0, paused: true };

  const now = new Date();
  const policy = await getPolicy();

  // The real governor: a minimum wall-clock gap between deliveries, derived from
  // both the explicit min gap and the rate implied by maxPerHour. This is what
  // makes the queue DRIP instead of bursting. Each invocation releases at most
  // ONE message, and only once this gap has elapsed since the last send. So no
  // matter how the trigger behaves, fired every minute, fired in bunches, or
  // catching up after the cron was down, it can never dump the whole hourly
  // budget at once. (The admin "Send now" flush is a separate path that
  // intentionally ignores all of this.)
  const effGapMs = Math.max(policy.minGapSeconds, Math.ceil(3600 / Math.max(1, policy.maxPerHour))) * 1000;

  const lastSent = await prisma.emailQueue.findFirst({
    where: { status: "sent", sentAt: { not: null } },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });
  if (lastSent?.sentAt && now.getTime() - lastSent.sentAt.getTime() < effGapMs) {
    return { processed: 0, sent: 0, failed: 0, throttled: true };
  }

  // Hourly / daily caps as a safety ceiling on top of the gap.
  const [sentHour, sentDay] = await Promise.all([
    prisma.emailQueue.count({ where: { status: "sent", sentAt: { gte: new Date(now.getTime() - 3600_000) } } }),
    prisma.emailQueue.count({ where: { status: "sent", sentAt: { gte: new Date(now.getTime() - 24 * 3600_000) } } }),
  ]);
  if (sentHour >= policy.maxPerHour || sentDay >= policy.maxPerDay) {
    return { processed: 0, sent: 0, failed: 0, throttled: true };
  }

  const due = await prisma.emailQueue.findMany({
    where: { status: "pending", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: 1,
  });

  let sent = 0;
  let failed = 0;
  for (const item of due) {
    const claim = await prisma.emailQueue.updateMany({
      where: { id: item.id, status: "pending" },
      data: { status: "sending", attempts: { increment: 1 } },
    });
    if (claim.count === 0) continue;

    // Honor an unsubscribe, attach the one-click header, and CC any merged
    // co-applicant emails for sponsor sends.
    let extraHeaders: Record<string, string> | undefined;
    let extraCc: string[] | undefined;
    if (item.recipientType === "sponsor" && item.recipientId) {
      const sp = await prisma.sponsor.findUnique({
        where: { id: item.recipientId },
        select: { applicationToken: true, unsubscribedAt: true, additionalEmails: true },
      });
      if (sp?.unsubscribedAt) {
        await prisma.emailQueue.update({ where: { id: item.id }, data: { status: "skipped" } });
        continue;
      }
      if (sp?.applicationToken) extraHeaders = sponsorUnsubHeaders(sp.applicationToken);
      if (sp?.additionalEmails?.length) extraCc = sp.additionalEmails;
    } else if (item.recipientType === "attendee" && item.recipientId) {
      const at = await prisma.attendee.findUnique({
        where: { id: item.recipientId },
        select: { inviteToken: true, unsubscribedAt: true },
      });
      if (at?.unsubscribedAt) {
        await prisma.emailQueue.update({ where: { id: item.id }, data: { status: "skipped" } });
        continue;
      }
      if (at?.inviteToken) extraHeaders = attendeeUnsubHeaders(at.inviteToken);
    }

    try {
      const result = await sendMail({
        to: item.to,
        subject: item.subject,
        html: item.html,
        text: item.textBody || undefined,
        ...queueEnvelope(item.recipientType),
        cc: extraCc,
        headers: extraHeaders,
      });
      const resendId = (result as { id?: string })?.id || null;
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: { status: "sent", sentAt: new Date(), resendId },
      });
      await afterQueueSend(item);
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = (e as { status?: number }).status;
      const giveUp = item.attempts >= 4 || (status !== undefined && status >= 400 && status < 500);
      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: giveUp ? "failed" : "pending",
          lastError: msg.slice(0, 500),
          scheduledFor: giveUp ? item.scheduledFor : new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      failed++;
    }
  }
  return { processed: due.length, sent, failed };
}

// Per-recipient-type envelope (personalized From / Reply-To). Used by every
// place that actually delivers a queued message (cron + admin flush).
export function queueEnvelope(recipientType: string): { from?: string; replyTo?: string; bcc?: string } {
  if (recipientType === "attendee") return { from: attendeeFromHeader(), replyTo: attendeeReplyTo(), bcc: attendeeBcc() };
  if (recipientType === "sponsor") return { from: sponsorFromHeader(), replyTo: sponsorLetterReplyTo() };
  return {};
}

// After a queued invite is delivered, advance the recipient's record
// (queued -> invited) and log an event. Single source for attendees + sponsors.
export async function afterQueueSend(item: { recipientType: string; recipientId: string | null }) {
  if (!item.recipientId) return;
  if (item.recipientType === "attendee") {
    await prisma.attendee.updateMany({ where: { id: item.recipientId, status: { in: ["queued"] } }, data: { status: "invited", invitedAt: new Date(), lastSentAt: new Date() } });
    await prisma.attendee.updateMany({ where: { id: item.recipientId, status: { notIn: ["queued"] } }, data: { lastSentAt: new Date() } });
    await prisma.attendeeEvent.create({ data: { attendeeId: item.recipientId, type: "invite_sent" } }).catch(() => {});
  } else if (item.recipientType === "sponsor") {
    await prisma.sponsor.updateMany({ where: { id: item.recipientId, status: { in: ["queued"] } }, data: { status: "invited", invitedAt: new Date(), lastSentAt: new Date() } });
    await prisma.sponsor.updateMany({ where: { id: item.recipientId, status: { notIn: ["queued"] } }, data: { lastSentAt: new Date() } });
    await prisma.sponsorEvent.create({ data: { sponsorId: item.recipientId, type: "invite_sent" } }).catch(() => {});
  }
}

function hourKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
}
function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}
function bumpBuckets(d: Date, h: Map<string, number>, dy: Map<string, number>) {
  h.set(hourKey(d), (h.get(hourKey(d)) || 0) + 1);
  dy.set(dayKey(d), (dy.get(dayKey(d)) || 0) + 1);
}
