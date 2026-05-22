import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rebuildScheduleForTask } from "@/lib/schedule-builder";
import { dispatchToUser } from "@/lib/push";
import { parseSettings } from "@/lib/notification-prefs";

let tableEnsured = false;

async function ensureTasksTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "lcc_tasks" (
        "id" TEXT NOT NULL,
        "committeeId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'todo',
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "progress" INTEGER NOT NULL DEFAULT 0,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "color" TEXT,
        "url" TEXT,
        "assigneeId" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3),
        CONSTRAINT "lcc_tasks_pkey" PRIMARY KEY ("id")
      )
    `);
    // Add foreign keys only if they don't already exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lcc_tasks_committeeId_fkey') THEN
          ALTER TABLE "lcc_tasks" ADD CONSTRAINT "lcc_tasks_committeeId_fkey"
            FOREIGN KEY ("committeeId") REFERENCES "lcc_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lcc_tasks_assigneeId_fkey') THEN
          ALTER TABLE "lcc_tasks" ADD CONSTRAINT "lcc_tasks_assigneeId_fkey"
            FOREIGN KEY ("assigneeId") REFERENCES "lcc_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("ensureTasksTable error:", err);
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const committeeId = searchParams.get("committeeId");

    await ensureTasksTable();

    const tasks = await prisma.task.findMany({
      where: committeeId ? { committeeId } : undefined,
      include: {
        assignee: { select: { id: true, name: true } },
        committee: { select: { id: true, name: true, slug: true, color: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
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

    await ensureTasksTable();

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

    rebuildScheduleForTask(task.id).catch((e) => console.error("[tasks] enqueue", e));
    if (task.assigneeId && task.assigneeId !== userId) {
      notifyTaskAssigned(task.assigneeId, task.id, task.title).catch((e) =>
        console.error("[tasks] assignment push", e)
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
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

    await ensureTasksTable();

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

    const previous = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, status: true },
    });

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    rebuildScheduleForTask(task.id).catch((e) => console.error("[tasks] enqueue", e));

    const currentUserId = (session.user as { id: string }).id;
    if (
      task.assigneeId &&
      task.assigneeId !== previous?.assigneeId &&
      task.assigneeId !== currentUserId
    ) {
      notifyTaskAssigned(task.assigneeId, task.id, task.title).catch((e) =>
        console.error("[tasks] assignment push", e)
      );
    }
    if (
      status !== undefined &&
      previous &&
      previous.status !== task.status &&
      task.assigneeId &&
      task.assigneeId !== currentUserId
    ) {
      notifyTaskStatus(task.assigneeId, task.id, task.title, task.status).catch((e) =>
        console.error("[tasks] status push", e)
      );
    }

    return NextResponse.json(task);
  } catch (err) {
    console.error("PUT /api/tasks error:", err);
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

    await ensureTasksTable();

    await prisma.scheduledNotification.deleteMany({
      where: { source: `task:${taskId}`, status: "pending" },
    });
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

async function notifyTaskAssigned(userId: string, taskId: string, title: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: { select: { settings: true } } },
  });
  const settings = parseSettings(user?.notificationPrefs?.settings);
  if (!settings.tasks.enabled || !settings.tasks.onAssigned) return;
  await dispatchToUser(userId, {
    channel: "tasks",
    title: "Task assigned to you",
    body: title,
    data: { kind: "task_assigned", taskId },
  });
}

async function notifyTaskStatus(userId: string, taskId: string, title: string, status: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: { select: { settings: true } } },
  });
  const settings = parseSettings(user?.notificationPrefs?.settings);
  if (!settings.tasks.enabled || !settings.tasks.onStatusChange) return;
  await dispatchToUser(userId, {
    channel: "tasks",
    title,
    body: `Status changed to ${status}`,
    data: { kind: "task_status", taskId, status },
  });
}
