import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatchToUsers } from "@/lib/push";
import { parseSettings, discussionScopeFor } from "@/lib/notification-prefs";
import { resolveMentions } from "@/lib/mentions";

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

    // Global discussions (committeeId null) are open to all authenticated users.
    if (discussion.committeeId) {
      const membership = await prisma.committeeMember.findUnique({
        where: { userId_committeeId: { userId, committeeId: discussion.committeeId } },
      });
      if (!membership) {
        return NextResponse.json({ error: "Must be a committee member to reply" }, { status: 403 });
      }
    }

    const post = await prisma.post.create({
      data: { discussionId: params.id, authorId: userId, body },
      include: { author: { select: { id: true, name: true } } },
    });

    // Resolve mentions against committee membership (or all users if global)
    const candidates = discussion.committeeId
      ? await prisma.committeeMember.findMany({
          where: { committeeId: discussion.committeeId },
          select: { user: { select: { id: true, name: true } } },
        }).then((rows) => rows.map((r) => r.user))
      : await prisma.user.findMany({ select: { id: true, name: true } });

    const mentionedIds = resolveMentions(body, candidates).filter((id) => id !== userId);
    if (mentionedIds.length) {
      await prisma.mention.createMany({
        data: mentionedIds.map((uid) => ({
          userId: uid,
          postId: post.id,
          discussionId: discussion.id,
        })),
        skipDuplicates: true,
      });
    }

    notifyDiscussionPost(
      discussion.committeeId,
      discussion.id,
      discussion.title,
      post.author.name,
      userId,
      mentionedIds
    ).catch((e) => console.error("[posts] push notify error", e));

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
  mentionedIds: string[],
) {
  // Mention notifications go out regardless of committee discussion scope,
  // gated only by the per-user mentions toggle.
  if (mentionedIds.length) {
    await dispatchToUsers(mentionedIds, {
      channel: "mentions",
      title: `${authorName} mentioned you`,
      body: discussionTitle,
      threadId: discussionId,
      data: { kind: "mention", discussionId, ...(committeeId ? { committeeId } : {}) },
    });
  }

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
  const mentioned = new Set(mentionedIds);
  const recipients = members
    .filter((m) => m.userId !== authorId && !mentioned.has(m.userId))
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
