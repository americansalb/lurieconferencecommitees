-- CreateTable: presenter confirmation funnel for the AALB Conference at Lurie Children's
CREATE TABLE IF NOT EXISTS "lcc_presenters" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "affiliation" TEXT,
    "jobTitle" TEXT,
    "pronouns" TEXT,
    "phone" TEXT,

    "talkTitle" TEXT,
    "talkAbstract" TEXT,
    "sessionFormat" TEXT,
    "sessionTrack" TEXT,
    "sessionLength" TEXT,
    "coPresenters" TEXT,
    "preferredDay" TEXT,
    "learningObjectives" TEXT,

    "bio" TEXT,
    "headshotData" BYTEA,
    "headshotMime" TEXT,
    "websiteUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,

    "avNotes" TEXT,
    "needsMic" BOOLEAN NOT NULL DEFAULT false,
    "needsProjector" BOOLEAN NOT NULL DEFAULT false,
    "needsAudio" BOOLEAN NOT NULL DEFAULT false,
    "needsInternet" BOOLEAN NOT NULL DEFAULT false,
    "needsRecording" BOOLEAN NOT NULL DEFAULT false,
    "needsClicker" BOOLEAN NOT NULL DEFAULT false,

    "travelMode" TEXT,
    "travelOrigin" TEXT,
    "travelArrival" TIMESTAMP(3),
    "travelDeparture" TIMESTAMP(3),
    "needsHotel" BOOLEAN NOT NULL DEFAULT false,
    "hotelNotes" TEXT,
    "needsParking" BOOLEAN NOT NULL DEFAULT false,

    "dietary" TEXT,
    "allergies" TEXT,
    "accessibilityNeeds" TEXT,
    "emergencyContact" TEXT,

    "agreedToRecord" BOOLEAN NOT NULL DEFAULT false,
    "agreedToPhoto" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,

    "status" TEXT NOT NULL DEFAULT 'invited',
    "declineReason" TEXT,
    "token" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "invitedById" TEXT,

    CONSTRAINT "lcc_presenters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lcc_presenters_email_key" ON "lcc_presenters"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_presenters_token_key" ON "lcc_presenters"("token");
CREATE INDEX IF NOT EXISTS "lcc_presenters_status_idx" ON "lcc_presenters"("status");

CREATE TABLE IF NOT EXISTS "lcc_presenter_events" (
    "id" TEXT NOT NULL,
    "presenterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meta" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_presenter_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lcc_presenter_events_presenterId_idx" ON "lcc_presenter_events"("presenterId");

ALTER TABLE "lcc_presenter_events" ADD CONSTRAINT "lcc_presenter_events_presenterId_fkey"
    FOREIGN KEY ("presenterId") REFERENCES "lcc_presenters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
