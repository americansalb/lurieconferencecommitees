import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatchToUsers } from "@/lib/push";
import { parseSettings, discussionScopeFor } from "@/lib/notification-prefs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { body } = await req.json();

    if (!body) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: params.id },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    const userId = (session.user as { id: string }).id;

    const membership = await prisma.committeeMember.findUnique({
      where: { userId_committeeId: { userId, committeeId: discussion.committeeId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Must be a committee member to reply" }, { status: 403 });
    }

    const post = await prisma.post.create({
      data: { discussionId: params.id, authorId: userId, body },
      include: { author: { select: { id: true, name: true } } },
    });

    notifyDiscussionPost(discussion.committeeId, discussion.id, discussion.title, post.author.name, userId)
      .catch((e) => console.error("[posts] push notify error", e));

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

async function notifyDiscussionPost(
  committeeId: string | null,
  discussionId: string,
  discussionTitle: string,
  authorName: string,
  authorId: string,
) {
  if (!committeeId) return;
  const members = await prisma.committeeMember.findMany({
    where: { committeeId },
    select: {
      userId: true,
      user: {
        select: { id: true, notificationPrefs: { select: { settings: true } } },
      },
    },
  });
  const recipients = members
    .filter((m) => m.userId !== authorId)
    .filter((m) => {
      const settings = parseSettings(m.user.notificationPrefs?.settings);
      const scope = discussionScopeFor(settings, committeeId);
      return scope === "all" || scope === "subscribed";
    })
    .map((m) => m.userId);

  if (!recipients.length) return;

  await dispatchToUsers(recipients, {
    channel: "discussions",
    title: discussionTitle,
    body: `${authorName} replied`,
    threadId: discussionId,
    data: { kind: "discussion_post", discussionId, committeeId },
  });
}
