// Minimal RFC 5545 VCALENDAR builder. Outputs UTC times so subscribers in any
// timezone see correct moments. Long lines are not folded, modern clients
// (Google, Apple, Outlook) all tolerate that.

export type IcalEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  url?: string | null;
  updatedAt?: Date | null;
};

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function fmtUtc(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildCalendar(
  calendarName: string,
  events: IcalEvent[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AALB//Conference Committee Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escape(calendarName)}`,
    "X-PUBLISHED-TTL:PT1H",
  ];

  const stamp = fmtUtc(new Date());
  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.id}@conference.aalb.org`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${fmtUtc(ev.startTime)}`);
    lines.push(`DTEND:${fmtUtc(ev.endTime)}`);
    if (ev.updatedAt) lines.push(`LAST-MODIFIED:${fmtUtc(ev.updatedAt)}`);
    lines.push(`SUMMARY:${escape(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
    if (ev.url) lines.push(`URL:${escape(ev.url)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
