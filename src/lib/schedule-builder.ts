import { prisma } from "./db";
import { parseSettings, eventLeadTimes, NotificationSettings } from "./notification-prefs";

const MIN_FUTURE_LEAD_MS = 30 * 1000;

export async function rebuildScheduleForEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { committee: { select: { id: true, name: true } } },
  });
  await prisma.scheduledNotification.deleteMany({
    where: { source: `event:${eventId}`, status: "pending" },
  });
  if (!event) return;
  if (event.startTime.getTime() <= Date.now() + MIN_FUTURE_LEAD_MS) return;

  const members = await prisma.committeeMember.findMany({
    where: { committeeId: event.committeeId },
    select: {
      userId: true,
      user: { select: { notificationPrefs: { select: { settings: true } } } },
    },
  });

  const rows: Array<{
    userId: string;
    channel: string;
    title: string;
    body: string;
    payload: string;
    scheduledFor: Date;
    source: string;
  }> = [];

  const startMs = event.startTime.getTime();
  for (const m of members) {
    const settings = parseSettings(m.user.notificationPrefs?.settings);
    if (!settings.events.enabled) continue;
    const leadTimes = eventLeadTimes(settings, event.committeeId);
    for (const minutes of leadTimes) {
      const scheduledFor = new Date(startMs - minutes * 60_000);
      if (scheduledFor.getTime() <= Date.now() + MIN_FUTURE_LEAD_MS) continue;
      rows.push({
        userId: m.userId,
        channel: "events",
        title: event.title,
        body: leadBody(minutes, event.committee?.name),
        payload: JSON.stringify({
          kind: "event",
          eventId: event.id,
          committeeId: event.committeeId,
        }),
        scheduledFor,
        source: `event:${event.id}`,
      });
    }
  }

  if (rows.length) {
    await prisma.scheduledNotification.createMany({ data: rows });
  }
}

export async function rebuildScheduleForTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { committee: { select: { id: true, name: true } } },
  });
  await prisma.scheduledNotification.deleteMany({
    where: { source: `task:${taskId}`, status: "pending" },
  });
  if (!task) return;
  if (!task.assigneeId) return;
  if (task.status === "done") return;
  if (task.endDate.getTime() <= Date.now() + MIN_FUTURE_LEAD_MS) return;

  const user = await prisma.user.findUnique({
    where: { id: task.assigneeId },
    include: { notificationPrefs: true },
  });
  if (!user) return;
  const settings = parseSettings(user.notificationPrefs?.settings);
  if (!settings.tasks.enabled) return;

  const dueMs = task.endDate.getTime();
  const rows = settings.tasks.leadTimesMinutes
    .map((minutes) => ({
      minutes,
      scheduledFor: new Date(dueMs - minutes * 60_000),
    }))
    .filter((r) => r.scheduledFor.getTime() > Date.now() + MIN_FUTURE_LEAD_MS)
    .map((r) => ({
      userId: task.assigneeId!,
      channel: "tasks",
      title: task.title,
      body: leadBody(r.minutes, task.committee?.name, "Task due"),
      payload: JSON.stringify({
        kind: "task",
        taskId: task.id,
        committeeId: task.committeeId,
      }),
      scheduledFor: r.scheduledFor,
      source: `task:${task.id}`,
    }));

  if (rows.length) {
    await prisma.scheduledNotification.createMany({ data: rows });
  }
}

export async function rebuildScheduleForUser(userId: string) {
  await prisma.scheduledNotification.deleteMany({
    where: { userId, status: "pending" },
  });

  const memberships = await prisma.committeeMember.findMany({
    where: { userId },
    select: { committeeId: true },
  });
  const committeeIds = memberships.map((m) => m.committeeId);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      committeeId: { in: committeeIds },
      startTime: { gt: new Date(Date.now() + MIN_FUTURE_LEAD_MS) },
    },
    include: { committee: { select: { id: true, name: true } } },
  });

  const assignedTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "done" },
      endDate: { gt: new Date(Date.now() + MIN_FUTURE_LEAD_MS) },
    },
    include: { committee: { select: { id: true, name: true } } },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPrefs: true },
  });
  if (!user) return;
  const settings: NotificationSettings = parseSettings(user.notificationPrefs?.settings);

  const rows: Array<{
    userId: string;
    channel: string;
    title: string;
    body: string;
    payload: string;
    scheduledFor: Date;
    source: string;
  }> = [];

  if (settings.events.enabled) {
    for (const event of upcomingEvents) {
      const leadTimes = eventLeadTimes(settings, event.committeeId);
      for (const minutes of leadTimes) {
        const scheduledFor = new Date(event.startTime.getTime() - minutes * 60_000);
        if (scheduledFor.getTime() <= Date.now() + MIN_FUTURE_LEAD_MS) continue;
        rows.push({
          userId,
          channel: "events",
          title: event.title,
          body: leadBody(minutes, event.committee?.name),
          payload: JSON.stringify({
            kind: "event",
            eventId: event.id,
            committeeId: event.committeeId,
          }),
          scheduledFor,
          source: `event:${event.id}`,
        });
      }
    }
  }

  if (settings.tasks.enabled) {
    for (const task of assignedTasks) {
      for (const minutes of settings.tasks.leadTimesMinutes) {
        const scheduledFor = new Date(task.endDate.getTime() - minutes * 60_000);
        if (scheduledFor.getTime() <= Date.now() + MIN_FUTURE_LEAD_MS) continue;
        rows.push({
          userId,
          channel: "tasks",
          title: task.title,
          body: leadBody(minutes, task.committee?.name, "Task due"),
          payload: JSON.stringify({
            kind: "task",
            taskId: task.id,
            committeeId: task.committeeId,
          }),
          scheduledFor,
          source: `task:${task.id}`,
        });
      }
    }
  }

  if (rows.length) {
    await prisma.scheduledNotification.createMany({ data: rows });
  }
}

function leadBody(minutes: number, committeeName?: string | null, prefix?: string): string {
  const lead = humanLead(minutes);
  const base = prefix ? `${prefix} in ${lead}` : `Starts in ${lead}`;
  return committeeName ? `${committeeName} · ${base}` : base;
}

function humanLead(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const hrs = Math.round(minutes / 60);
    return hrs === 1 ? "1 hour" : `${hrs} hours`;
  }
  const days = Math.round(minutes / 1440);
  return days === 1 ? "1 day" : `${days} days`;
}
