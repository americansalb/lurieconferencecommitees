import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
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

  return NextResponse.json(committees);
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
