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
