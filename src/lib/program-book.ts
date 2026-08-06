import { PROGRAM_DAYS } from "@/components/landing/program-data";

// Helpers for the speaker book: the printable document that lists every
// presenter with their slot, title, description, bio and learning objectives.
//
// The presenter database holds what each person wrote about themselves; the
// program holds when they are on. Neither knows about the other, so the join
// happens here, by name.

export type BookSlot = {
  /** "Day 1" */
  day: string;
  /** "Saturday, August 15" */
  date: string;
  /** "10:50 AM" */
  time: string;
  /** "12:00 PM" */
  end: string;
  /** The session title as scheduled, which may differ from the presenter's own. */
  title: string;
  /** Position in the two-day run, so the book can be ordered like the day is. */
  order: number;
};

// Accents, curly apostrophes and case all vary between what a presenter typed
// into the form and what the program says, so compare a flattened form.
function flatten(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^a-zA-Z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Every scheduled session that has someone's name on it, in running order. */
export function bookSlots(): BookSlot[] {
  const out: BookSlot[] = [];
  let order = 0;
  for (const day of PROGRAM_DAYS) {
    for (const s of day.sessions) {
      order += 1;
      if (!s.who) continue;
      out.push({ day: day.label, date: day.date, time: s.time, end: s.end, title: s.title, order });
    }
  }
  return out;
}

/**
 * Find the slot a presenter is speaking in. Full name first, then last name,
 * which covers "Yuri Takabatake, MD · Ann & Robert H. Lurie Children's" as well
 * as a two-presenter session like "Mercedes Martin, CHI™ & Hugo Juarez, CHI™".
 *
 * A last name alone is only trusted at 4 characters or more, so a short one
 * cannot collide with a word in a session's affiliation line.
 */
export function matchSlot(name: string, slots: BookSlot[], whoByOrder: Record<number, string>): BookSlot | null {
  const full = flatten(name);
  if (!full) return null;
  for (const slot of slots) {
    if (flatten(whoByOrder[slot.order] || "").includes(full)) return slot;
  }
  const parts = full.split(" ");
  const last = parts[parts.length - 1];
  if (last && last.length >= 4) {
    for (const slot of slots) {
      const who = ` ${flatten(whoByOrder[slot.order] || "")} `;
      if (who.includes(` ${last} `) || who.includes(` ${last}`)) return slot;
    }
  }
  return null;
}

/** The `who` line for each slot, keyed by order, for matching. */
export function whoLines(): Record<number, string> {
  const map: Record<number, string> = {};
  let order = 0;
  for (const day of PROGRAM_DAYS) {
    for (const s of day.sessions) {
      order += 1;
      if (s.who) map[order] = s.who;
    }
  }
  return map;
}

/**
 * Presenters type their learning objectives as one blob: sometimes numbered,
 * sometimes bulleted, sometimes three lines, sometimes one sentence with
 * semicolons. Pull them apart into separate lines so each can be edited and
 * printed on its own, and always hand back exactly three slots so the form has
 * somewhere to put a missing one.
 */
export function splitObjectives(raw: string | null | undefined, count = 3): string[] {
  const text = (raw || "").trim();
  let parts: string[] = [];

  if (text) {
    parts = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
    // One long line: fall back to numbering, then bullets, then semicolons.
    if (parts.length === 1) {
      const line = parts[0];
      if (/\d\s*[.)]\s+/.test(line.slice(1))) {
        parts = line.split(/(?=\d\s*[.)]\s+)/).map((l) => l.trim()).filter(Boolean);
      } else if (/[\u2022\u00b7\u25cf*]/.test(line)) {
        parts = line.split(/[\u2022\u00b7\u25cf*]+/).map((l) => l.trim()).filter(Boolean);
      } else if (line.includes(";")) {
        parts = line.split(";").map((l) => l.trim()).filter(Boolean);
      }
    }
  }

  const cleaned = parts.map((l) =>
    l
      .replace(/^\s*(?:objective\s*)?\d+\s*[.):-]?\s*/i, "")
      .replace(/^[-\u2013\u2014\u2022\u00b7\u25cf*]\s*/, "")
      .trim()
  ).filter(Boolean);

  const out = cleaned.slice(0, count);
  while (out.length < count) out.push("");
  return out;
}

/** "10:50 AM – 12:00 PM" from a slot, or an empty string when unscheduled. */
export function slotTimeLabel(slot: BookSlot | null): string {
  if (!slot) return "";
  return `${slot.time} – ${slot.end}`;
}
