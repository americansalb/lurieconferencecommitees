-- Sponsor applications + audit log. All additive; no destructive changes.

CREATE TABLE IF NOT EXISTS "lcc"."lcc_sponsors" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT,
  "contactRole" TEXT,
  "website" TEXT,
  "tier" TEXT NOT NULL,
  "customTierName" TEXT,
  "amountCents" INTEGER NOT NULL,
  "donateFoodInstead" BOOLEAN NOT NULL DEFAULT false,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "paid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "applicationToken" TEXT NOT NULL,
  "inviteMessage" TEXT,
  "invitedById" TEXT,
  "invitedAt" TIMESTAMP(3),
  "lastSentAt" TIMESTAMP(3),
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "lcc_sponsors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_sponsors_applicationToken_key" ON "lcc"."lcc_sponsors"("applicationToken");
CREATE INDEX IF NOT EXISTS "lcc_sponsors_status_idx" ON "lcc"."lcc_sponsors"("status");
CREATE INDEX IF NOT EXISTS "lcc_sponsors_tier_idx" ON "lcc"."lcc_sponsors"("tier");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_sponsor_events" (
  "id" TEXT NOT NULL,
  "sponsorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "meta" TEXT,
  "actorEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lcc_sponsor_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lcc_sponsor_events_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "lcc"."lcc_sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "lcc_sponsor_events_sponsorId_idx" ON "lcc"."lcc_sponsor_events"("sponsorId");
