import { prisma } from "./db";
import { sendApns } from "./apns";
import { sendFcm } from "./fcm";
import { parseSettings, shouldDeliver, NotificationSettings } from "./notification-prefs";

export type PushChannel = "events" | "tasks" | "discussions" | "broadcast";

export type PushPayload = {
  channel: PushChannel;
  title: string;
  body: string;
  data?: Record<string, string>;
  threadId?: string;
};

export type DispatchResult = {
  userId: string;
  delivered: number;
  skipped: boolean;
  reason?: string;
};

export async function dispatchToUser(
  userId: string,
  payload: PushPayload
): Promise<DispatchResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { devices: true, notificationPrefs: true },
  });
  if (!user) return { userId, delivered: 0, skipped: true, reason: "user not found" };

  const settings: NotificationSettings = parseSettings(user.notificationPrefs?.settings);
  const now = new Date();
  if (!shouldDeliver(settings, payload.channel, now, user.timezone)) {
    await logSent(userId, payload, "skipped_prefs");
    return { userId, delivered: 0, skipped: true, reason: "preferences" };
  }

  if (!user.devices.length) {
    await logSent(userId, payload, "no_devices");
    return { userId, delivered: 0, skipped: true, reason: "no devices" };
  }

  let delivered = 0;
  let lastError: string | undefined;
  for (const device of user.devices) {
    if (device.platform === "ios") {
      const result = await sendApns(device.pushToken, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        threadId: payload.threadId,
      });
      if (result.ok) {
        delivered++;
      } else {
        lastError = result.error || `apns ${result.status}`;
        if (result.unregistered) {
          await prisma.device.delete({ where: { id: device.id } }).catch(() => {});
        }
      }
    } else if (device.platform === "android") {
      const result = await sendFcm(device.pushToken, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });
      if (result.ok) {
        delivered++;
      } else {
        lastError = result.error || `fcm ${result.status}`;
        if (result.unregistered) {
          await prisma.device.delete({ where: { id: device.id } }).catch(() => {});
        }
      }
    }
  }

  await logSent(userId, payload, delivered > 0 ? "sent" : "failed", lastError);
  return { userId, delivered, skipped: false };
}

export async function dispatchToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<DispatchResult[]> {
  const unique = Array.from(new Set(userIds));
  return Promise.all(unique.map((uid) => dispatchToUser(uid, payload)));
}

async function logSent(
  userId: string,
  payload: PushPayload,
  status: string,
  error?: string
) {
  try {
    await prisma.notificationLog.create({
      data: {
        userId,
        channel: payload.channel,
        title: payload.title,
        body: payload.body,
        payload: payload.data ? JSON.stringify(payload.data) : null,
        status,
        error: error || null,
      },
    });
  } catch (e) {
    console.error("[push] failed to log notification", e);
  }
}
