CREATE SCHEMA IF NOT EXISTS lcc;

-- Pre-create columns/indexes that would otherwise trigger Prisma's
-- data-loss warning on db push. Idempotent so this runs on every deploy.
ALTER TABLE IF EXISTS "lcc"."lcc_users"
  ADD COLUMN IF NOT EXISTS "icalToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_users_icalToken_key"
  ON "lcc"."lcc_users"("icalToken");

-- Sponsor team links (shareable "who is coming from your org" page). The
-- unique index is what makes `db push` warn, so create it here first: on a
-- table that already has rows every teamToken is NULL, and Postgres treats
-- NULLs as distinct, so a unique index over them cannot collide. Additive
-- and idempotent; scoped to the lcc schema, which is the only schema this
-- app owns on the shared database.
ALTER TABLE IF EXISTS "lcc"."lcc_sponsors"
  ADD COLUMN IF NOT EXISTS "teamToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_sponsors_teamToken_key"
  ON "lcc"."lcc_sponsors"("teamToken");

-- Personalized conference guides: when each attendee's and exhibitor's guide
-- was last emailed. Plain nullable timestamps with no constraint, so `db push`
-- would add them without complaint; created here anyway to keep every schema
-- change on the same, reviewable path. Additive and idempotent, scoped to lcc.
ALTER TABLE IF EXISTS "lcc"."lcc_attendees"
  ADD COLUMN IF NOT EXISTS "guideSentAt" TIMESTAMP(3);
ALTER TABLE IF EXISTS "lcc"."lcc_sponsors"
  ADD COLUMN IF NOT EXISTS "guideSentAt" TIMESTAMP(3);

-- The Welcome to Chicago letter, sent to in-person attendees after the
-- attendee guide. Its own column so sending one never suppresses the other.
ALTER TABLE IF EXISTS "lcc"."lcc_attendees"
  ADD COLUMN IF NOT EXISTS "chicagoGuideSentAt" TIMESTAMP(3);

-- Scholarship applications: the ten free in-person seats for AALB alumni and
-- current students. New table, additive and idempotent, scoped to lcc.
CREATE TABLE IF NOT EXISTS "lcc"."lcc_scholarship_applications" (
  "id"             TEXT PRIMARY KEY,
  "email"          TEXT NOT NULL,
  "firstName"      TEXT NOT NULL,
  "lastName"       TEXT NOT NULL,
  "phone"          TEXT,
  "standing"       TEXT NOT NULL,
  "cohort"         TEXT,
  "currentRole"    TEXT,
  "languages"      TEXT,
  "whyAttend"      TEXT NOT NULL,
  "barrierSeen"    TEXT NOT NULL,
  "whatTheyWillDo" TEXT NOT NULL,
  "costBarrier"    TEXT,
  "accessibility"  TEXT,
  "dietary"        TEXT,
  "virtualInstead" BOOLEAN NOT NULL DEFAULT false,
  "status"         TEXT NOT NULL DEFAULT 'submitted',
  "reviewNotes"    TEXT,
  "score"          INTEGER,
  "decidedAt"      TIMESTAMP(3),
  "decidedBy"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "lcc_scholarship_applications_email_idx"
  ON "lcc"."lcc_scholarship_applications" ("email");
CREATE INDEX IF NOT EXISTS "lcc_scholarship_applications_status_idx"
  ON "lcc"."lcc_scholarship_applications" ("status");

-- Who put a presentation on file: null when the presenter uploaded it from
-- their own portal, an email when the team did it for them. Additive.
ALTER TABLE "lcc"."lcc_presenter_slides"
  ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;

-- Presentations are stored in pieces. Appending to a single bytea rewrites the
-- whole value each time, which made a 100 MB deck take 34.5 seconds; as rows it
-- takes 3.5. Additive, and the old "data" column stays for decks uploaded
-- before this.
ALTER TABLE "lcc"."lcc_presenter_slides"
  ADD COLUMN IF NOT EXISTS "uploadId" TEXT;

CREATE TABLE IF NOT EXISTS "lcc"."lcc_presenter_slide_chunks" (
  "presenterId" TEXT    NOT NULL,
  "uploadId"    TEXT    NOT NULL,
  "seq"         INTEGER NOT NULL,
  "data"        BYTEA   NOT NULL,
  PRIMARY KEY ("presenterId", "uploadId", "seq")
);

DO $$
BEGIN
  ALTER TABLE "lcc"."lcc_presenter_slide_chunks"
    ADD CONSTRAINT "lcc_presenter_slide_chunks_presenterId_fkey"
    FOREIGN KEY ("presenterId") REFERENCES "lcc"."lcc_presenter_slides"("presenterId")
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Paying presenters after the conference: when we asked where to send the
-- cheque, and the address if they replied with one. Additive.
ALTER TABLE "lcc"."lcc_presenters"
  ADD COLUMN IF NOT EXISTS "honorariumAskedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mailingAddress"    TEXT;

-- Attendee feedback about sessions, shared with each presenter through a
-- dedicated token. Additive.
ALTER TABLE "lcc"."lcc_presenters"
  ADD COLUMN IF NOT EXISTS "feedbackToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_presenters_feedbackToken_key"
  ON "lcc"."lcc_presenters" ("feedbackToken");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_feedback_responses" (
  "id"           TEXT PRIMARY KEY,
  "importId"     TEXT NOT NULL,
  "sessionLabel" TEXT NOT NULL,
  "presenterId"  TEXT,
  "ratings"      JSONB NOT NULL,
  "comments"     JSONB NOT NULL,
  "hiddenKeys"   JSONB NOT NULL DEFAULT '{}',
  "data"         JSONB NOT NULL,
  "submittedAt"  TIMESTAMP(3),
  "importedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "lcc_feedback_responses_presenterId_idx"
  ON "lcc"."lcc_feedback_responses" ("presenterId");
CREATE INDEX IF NOT EXISTS "lcc_feedback_responses_importId_idx"
  ON "lcc"."lcc_feedback_responses" ("importId");
DO $$
BEGIN
  ALTER TABLE "lcc"."lcc_feedback_responses"
    ADD CONSTRAINT "lcc_feedback_responses_presenterId_fkey"
    FOREIGN KEY ("presenterId") REFERENCES "lcc"."lcc_presenters"("id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
