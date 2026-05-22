-- Push notifications infrastructure: device tokens, mobile sessions,
-- per-user preferences (JSON), send log, and scheduled queue.

CREATE TABLE IF NOT EXISTS "lcc"."lcc_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "appVersion" TEXT,
    "deviceName" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lcc_devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_devices_pushToken_key" ON "lcc"."lcc_devices"("pushToken");
CREATE INDEX IF NOT EXISTS "lcc_devices_userId_idx" ON "lcc"."lcc_devices"("userId");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_mobile_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    CONSTRAINT "lcc_mobile_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_mobile_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_mobile_sessions_token_key" ON "lcc"."lcc_mobile_sessions"("token");
CREATE INDEX IF NOT EXISTS "lcc_mobile_sessions_userId_idx" ON "lcc"."lcc_mobile_sessions"("userId");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lcc_notification_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_notification_preferences_userId_key" ON "lcc"."lcc_notification_preferences"("userId");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_notification_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    CONSTRAINT "lcc_notification_log_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_notification_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "lcc_notification_log_userId_sentAt_idx" ON "lcc"."lcc_notification_log"("userId", "sentAt");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_scheduled_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lcc_scheduled_notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_scheduled_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "lcc_scheduled_notifications_status_scheduledFor_idx" ON "lcc"."lcc_scheduled_notifications"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "lcc_scheduled_notifications_userId_idx" ON "lcc"."lcc_scheduled_notifications"("userId");
CREATE INDEX IF NOT EXISTS "lcc_scheduled_notifications_source_idx" ON "lcc"."lcc_scheduled_notifications"("source");
