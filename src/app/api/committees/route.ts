import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const committees = await prisma.committee.findMany({
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      discussions: {
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { posts: true } },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      },
      events: { orderBy: { startTime: "asc" } },
      _count: { select: { members: true, discussions: true, events: true } },
    },
    orderBy: { name: "asc" },
  });

  // Layer in unread counts per discussion for the current user
  if (userId) {
    const unreadByDisc = await fetchUnreadCounts(userId);
    for (const c of committees) {
      for (const d of c.discussions) {
        (d as unknown as { unreadCount: number }).unreadCount = unreadByDisc.get(d.id) || 0;
      }
    }
  }

  return NextResponse.json(committees);
}

async function fetchUnreadCounts(userId: string): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<{ discussionId: string; count: bigint }[]>`
    SELECT p."discussionId", COUNT(*)::bigint AS count
    FROM lcc.lcc_posts p
    LEFT JOIN lcc.lcc_discussion_reads r
      ON r."discussionId" = p."discussionId" AND r."userId" = ${userId}
    WHERE p."authorId" <> ${userId}
      AND p."createdAt" > COALESCE(r."lastReadAt", to_timestamp(0))
    GROUP BY p."discussionId"
  `;
  return new Map(rows.map((r) => [r.discussionId, Number(r.count)]));
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (userRole !== "developer" && userRole !== "admin") {
      return NextResponse.json({ error: "Only admins can create committees" }, { status: 403 });
    }

    const { name, description, color, icon } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Committee name is required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const existing = await prisma.committee.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A committee with this name already exists" }, { status: 409 });
    }

    const committee = await prisma.committee.create({
      data: {
        name: name.trim(),
        slug,
        description: description || "",
        color: color || "#3B82F6",
        icon: icon || "users",
      },
    });

    return NextResponse.json(committee, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create committee" }, { status: 500 });
  }
}
