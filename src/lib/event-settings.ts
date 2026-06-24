import { prisma } from "./db";

// Conference-wide settings shown in the attendee portal. Stored as
// SystemSetting rows (admin-editable), with an env fallback for the join URL.
export type EventSettings = { joinUrl: string | null; agendaUrl: string };

export async function getEventSettings(): Promise<EventSettings> {
  const rows = await prisma.systemSetting
    .findMany({ where: { key: { in: ["conference.joinUrl", "conference.agendaUrl"] } } })
    .catch(() => [] as { key: string; value: string }[]);
  const get = (k: string) => rows.find((r) => r.key === k)?.value?.trim() || "";
  return {
    joinUrl: get("conference.joinUrl") || process.env.CONFERENCE_JOIN_URL?.trim() || null,
    agendaUrl: get("conference.agendaUrl") || "/schedule",
  };
}

export async function saveEventSettings(input: { joinUrl?: string; agendaUrl?: string }): Promise<EventSettings> {
  const entries: [string, string | undefined][] = [
    ["conference.joinUrl", input.joinUrl],
    ["conference.agendaUrl", input.agendaUrl],
  ];
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    await prisma.systemSetting.upsert({ where: { key }, create: { key, value: value.trim() }, update: { value: value.trim() } });
  }
  return getEventSettings();
}
