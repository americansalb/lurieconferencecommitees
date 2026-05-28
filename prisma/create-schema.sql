CREATE SCHEMA IF NOT EXISTS lcc;

-- Pre-create columns/indexes that would otherwise trigger Prisma's
-- data-loss warning on db push. Idempotent so this runs on every deploy.
ALTER TABLE IF EXISTS "lcc"."lcc_users"
  ADD COLUMN IF NOT EXISTS "icalToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_users_icalToken_key"
  ON "lcc"."lcc_users"("icalToken");
