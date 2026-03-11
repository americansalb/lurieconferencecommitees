import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const committeeId = searchParams.get("committeeId");

  if (!committeeId) {
    return NextResponse.json({ error: "committeeId is required" }, { status: 400 });
  }

  const tasks = await prisma.task.findMany({
    where: { committeeId },
    include: {
      assignee: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { committeeId, title, description, startDate, endDate, priority, color, url, assigneeId } = await req.json();

    if (!committeeId || !title || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.committeeMember.findUnique({
      where: { userId_committeeId: { userId, committeeId } },
    });
    const userRole = (session.user as { role?: string }).role;
    if (!membership && userRole !== "admin" && userRole !== "developer") {
      return NextResponse.json({ error: "Must be a committee member" }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        committeeId,
        title,
        description: description || "",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority: priority || "medium",
        color: color || null,
        url: url || null,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, title, description, startDate, endDate, status, priority, progress, color, url, assigneeId, sortOrder } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (progress !== undefined) data.progress = Math.max(0, Math.min(100, progress));
    if (color !== undefined) data.color = color;
    if (url !== undefined) data.url = url || null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
