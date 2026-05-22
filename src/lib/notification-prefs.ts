export type DiscussionScope = "all" | "subscribed" | "mentions" | "none";

export type NotificationSettings = {
  events: {
    enabled: boolean;
    leadTimesMinutes: number[];
    committeeOverrides: Record<string, { enabled?: boolean; leadTimesMinutes?: number[] }>;
  };
  tasks: {
    enabled: boolean;
    leadTimesMinutes: number[];
    onAssigned: boolean;
    onStatusChange: boolean;
    onlyMyTasks: boolean;
  };
  discussions: {
    enabled: boolean;
    scope: DiscussionScope;
    committeeOverrides: Record<string, DiscussionScope>;
  };
  broadcast: {
    enabled: boolean;
  };
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  mutedDays: string[];
};

export const DEFAULT_SETTINGS: NotificationSettings = {
  events: {
    enabled: true,
    leadTimesMinutes: [15, 60, 1440],
    committeeOverrides: {},
  },
  tasks: {
    enabled: true,
    leadTimesMinutes: [60, 1440],
    onAssigned: true,
    onStatusChange: false,
    onlyMyTasks: true,
  },
  discussions: {
    enabled: true,
    scope: "subscribed",
    committeeOverrides: {},
  },
  broadcast: {
    enabled: true,
  },
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
  },
  mutedDays: [],
};

export function parseSettings(raw: string | null | undefined): NotificationSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return mergeSettings(DEFAULT_SETTINGS, parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function mergeSettings(
  base: NotificationSettings,
  override: Partial<NotificationSettings>
): NotificationSettings {
  return {
    events: { ...base.events, ...(override.events || {}) },
    tasks: { ...base.tasks, ...(override.tasks || {}) },
    discussions: { ...base.discussions, ...(override.discussions || {}) },
    broadcast: { ...base.broadcast, ...(override.broadcast || {}) },
    quietHours: { ...base.quietHours, ...(override.quietHours || {}) },
    mutedDays: override.mutedDays ?? base.mutedDays,
  };
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function isWithinQuietHours(
  settings: NotificationSettings,
  now: Date,
  timezone: string
): boolean {
  if (!settings.quietHours.enabled) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "America/Chicago",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hourStr = parts.find((p) => p.type === "hour")?.value || "0";
  const hour = parseInt(hourStr, 10) % 24;
  const { startHour, endHour } = settings.quietHours;
  if (startHour === endHour) return false;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

export function isMutedToday(
  settings: NotificationSettings,
  now: Date,
  timezone: string
): boolean {
  if (!settings.mutedDays.length) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "America/Chicago",
    weekday: "short",
  }).formatToParts(now);
  const wk = (parts.find((p) => p.type === "weekday")?.value || "").toLowerCase().slice(0, 3);
  return settings.mutedDays.map((d) => d.toLowerCase()).includes(wk)
    || (DAY_KEYS.includes(wk) && settings.mutedDays.map((d) => d.toLowerCase()).includes(wk));
}

export function shouldDeliver(
  settings: NotificationSettings,
  channel: "events" | "tasks" | "discussions" | "broadcast",
  now: Date,
  timezone: string
): boolean {
  if (!settings[channel].enabled) return false;
  if (channel !== "broadcast") {
    if (isWithinQuietHours(settings, now, timezone)) return false;
    if (isMutedToday(settings, now, timezone)) return false;
  }
  return true;
}

export function discussionScopeFor(
  settings: NotificationSettings,
  committeeId: string | null | undefined
): DiscussionScope {
  if (committeeId && settings.discussions.committeeOverrides[committeeId]) {
    return settings.discussions.committeeOverrides[committeeId];
  }
  return settings.discussions.scope;
}

export function eventLeadTimes(
  settings: NotificationSettings,
  committeeId: string | null | undefined
): number[] {
  const override = committeeId ? settings.events.committeeOverrides[committeeId] : undefined;
  if (override?.enabled === false) return [];
  if (override?.leadTimesMinutes && override.leadTimesMinutes.length) {
    return override.leadTimesMinutes;
  }
  return settings.events.leadTimesMinutes;
}
