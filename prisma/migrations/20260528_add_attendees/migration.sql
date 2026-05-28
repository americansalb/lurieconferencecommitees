-- Attendee invite system + queued mass mail + system settings.
-- All additive; no destructive changes to existing tables.

CREATE TABLE IF NOT EXISTS "lcc"."lcc_attendees" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "affiliation" TEXT,
  "primaryLanguages" TEXT,
  "attendanceMode" TEXT,
  "needsParking" BOOLEAN,
  "accessibilityNotes" TEXT,
  "dietary" TEXT,
  "notes" TEXT,
  "discountPercent" INTEGER NOT NULL DEFAULT 25,
  "basePriceCents" INTEGER,
  "finalPriceCents" INTEGER,
  "paid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "declineReason" TEXT,
  "inviteToken" TEXT NOT NULL,
  "inviteMessage" TEXT,
  "invitedById" TEXT,
  "invitedAt" TIMESTAMP(3),
  "lastSentAt" TIMESTAMP(3),
  "viewedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "lcc_attendees_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_attendees_email_key" ON "lcc"."lcc_attendees"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_attendees_inviteToken_key" ON "lcc"."lcc_attendees"("inviteToken");
CREATE INDEX IF NOT EXISTS "lcc_attendees_status_idx" ON "lcc"."lcc_attendees"("status");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_attendee_events" (
  "id" TEXT NOT NULL,
  "attendeeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "meta" TEXT,
  "actorEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lcc_attendee_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lcc_attendee_events_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "lcc"."lcc_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "lcc_attendee_events_attendeeId_idx" ON "lcc"."lcc_attendee_events"("attendeeId");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_email_queue" (
  "id" TEXT NOT NULL,
  "batchId" TEXT,
  "recipientType" TEXT NOT NULL DEFAULT 'attendee',
  "recipientId" TEXT,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "textBody" TEXT,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "resendId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "lcc_email_queue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "lcc_email_queue_status_scheduledFor_idx" ON "lcc"."lcc_email_queue"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "lcc_email_queue_batchId_idx" ON "lcc"."lcc_email_queue"("batchId");
CREATE INDEX IF NOT EXISTS "lcc_email_queue_recipientType_recipientId_idx" ON "lcc"."lcc_email_queue"("recipientType", "recipientId");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_system_settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lcc_system_settings_pkey" PRIMARY KEY ("key")
);
