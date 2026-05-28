import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PER_GROUP = 6;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({
      committees: [], discussions: [], posts: [], files: [], tasks: [], presenters: [],
    });
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "developer";
  const contains = { contains: q, mode: "insensitive" as const };

  const [committees, discussions, posts, files, tasks, presenters] = await Promise.all([
    prisma.committee.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      select: { id: true, name: true, slug: true, description: true, color: true, icon: true },
      take: PER_GROUP,
    }),
    prisma.discussion.findMany({
      where: { title: contains },
      select: {
        id: true,
        title: true,
        committee: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PER_GROUP,
    }),
    prisma.post.findMany({
      where: { body: contains },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
        discussion: {
          select: {
            id: true,
            title: true,
            committee: { select: { id: true, name: true, slug: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PER_GROUP,
    }),
    prisma.committeeFile.findMany({
      where: { title: contains },
      select: {
        id: true,
        title: true,
        url: true,
        type: true,
        committee: { select: { id: true, name: true, slug: true, color: true } },
      },
      take: PER_GROUP,
    }),
    prisma.task.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        assignee: { select: { id: true, name: true } },
        committee: { select: { id: true, name: true, slug: true, color: true } },
      },
      orderBy: { endDate: "asc" },
      take: PER_GROUP,
    }),
    isAdmin
      ? prisma.presenter.findMany({
          where: {
            OR: [
              { name: contains },
              { email: contains },
              { talkTitle: contains },
              { affiliation: contains },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            affiliation: true,
            talkTitle: true,
            status: true,
          },
          take: PER_GROUP,
        })
      : Promise.resolve([]),
  ]);

  const snippet = (s: string) => {
    const idx = s.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return s.slice(0, 120);
    const start = Math.max(0, idx - 30);
    const end = Math.min(s.length, idx + q.length + 60);
    return (start > 0 ? "…" : "") + s.slice(start, end) + (end < s.length ? "…" : "");
  };

  return NextResponse.json({
    committees,
    discussions,
    posts: posts.map((p) => ({ ...p, snippet: snippet(p.body) })),
    files,
    tasks,
    presenters,
  });
}
