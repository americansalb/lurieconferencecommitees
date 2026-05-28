import { prisma } from "./db";

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
