import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bookSlots, matchSlots, whoLines, splitObjectives, slotTimeLabel, type BookSlot } from "@/lib/program-book";

// Everything the speaker book needs, in one call: each presenter's own words
// (title, description, bio, objectives) joined to the slot they are scheduled
// in. The builder page takes it from here and lets the copy be edited before
// anything is printed, so nothing on this route writes.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const presenters = await prisma.presenter.findMany({
    where: { status: { in: ["confirmed", "tentative", "changes_requested"] } },
    select: {
      id: true,
      name: true,
      email: true,
      jobTitle: true,
      affiliation: true,
      pronouns: true,
      talkTitle: true,
      talkAbstract: true,
      learningObjectives: true,
      bio: true,
      sessionFormat: true,
      sessionLength: true,
      qaLength: true,
      preferredDay: true,
      status: true,
      headshotMime: true,
    },
  });

  const slots = bookSlots();
  const who = whoLines();

  // One page per session, not per person. Someone on the program twice needs
  // both sittings in the book; the copy starts the same on each and gets
  // edited apart, which is the whole point of the builder.
  const entries = presenters.flatMap((p) => {
    const matched = matchSlots(p.name, slots, who);
    const sittings: (BookSlot | null)[] = matched.length ? matched : [null];
    return sittings.map((slot) => buildEntry(p, slot, matched.length));
  });

  // Running order, so the book reads like the two days do. Anyone we could not
  // place lands at the end, where a missing time is easy to spot.
  entries.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return NextResponse.json({ entries });
}

type PresenterRow = {
  id: string; name: string; email: string; jobTitle: string | null; affiliation: string | null;
  pronouns: string | null; talkTitle: string | null; talkAbstract: string | null;
  learningObjectives: string | null; bio: string | null; sessionFormat: string | null;
  sessionLength: string | null; qaLength: string | null; preferredDay: string | null;
  status: string; headshotMime: string | null;
};

function buildEntry(p: PresenterRow, slot: BookSlot | null, sessionCount: number) {
  return {
      // Unique per sitting, since a two-session presenter now has two pages and
      // the builder keeps per-page edits against this id.
      id: slot ? `${p.id}:${slot.order}` : p.id,
      presenterId: p.id,
      sessionCount,
      name: p.name,
      status: p.status,
      // The line under the name in the book: role at organization.
      jobTitle: p.jobTitle || "",
      affiliation: p.affiliation || "",
      pronouns: p.pronouns || "",
      hasHeadshot: !!p.headshotMime,
      // Their session as scheduled. Where the program and the presenter's own
      // record disagree on the title, the program wins by default: it is what
      // the printed schedule and the website already say.
      day: slot?.day || "",
      date: slot?.date || "",
      time: slotTimeLabel(slot),
      order: slot?.order ?? 9999,
      scheduledTitle: slot?.title || "",
      talkTitle: slot?.title || p.talkTitle || "",
      submittedTitle: p.talkTitle || "",
      description: p.talkAbstract || "",
      bio: p.bio || "",
      objectives: splitObjectives(p.learningObjectives),
      // Shown in the editor so gaps are obvious before printing, never printed.
      sessionLength: p.sessionLength || "",
      qaLength: p.qaLength || "",
      preferredDay: p.preferredDay || "",
      email: p.email,
  };
}
