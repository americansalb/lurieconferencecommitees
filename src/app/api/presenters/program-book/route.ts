import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bookSlots, matchSlot, whoLines, splitObjectives, slotTimeLabel } from "@/lib/program-book";

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

  const entries = presenters.map((p) => {
    const slot = matchSlot(p.name, slots, who);
    return {
      id: p.id,
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
  });

  // Running order, so the book reads like the two days do. Anyone we could not
  // place lands at the end, where a missing time is easy to spot.
  entries.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return NextResponse.json({ entries });
}
