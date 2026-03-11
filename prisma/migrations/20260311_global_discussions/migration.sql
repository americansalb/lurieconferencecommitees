-- AlterTable: make committeeId nullable and add isGlobal flag for global discussions
ALTER TABLE "lcc_discussions" ALTER COLUMN "committeeId" DROP NOT NULL;
ALTER TABLE "lcc_discussions" ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;

-- Add Executive Planning Committee
INSERT INTO "lcc_committees" (id, name, slug, description, color, icon)
VALUES (
  gen_random_uuid()::text,
  'Executive Planning Committee',
  'executive-planning',
  'Provides strategic leadership and oversight for the entire conference. Coordinates across all committees, sets timelines and milestones, manages the overall budget, resolves cross-committee issues, and ensures alignment with Lurie Children''s mission and AALB goals.',
  '#DC2626',
  'users'
) ON CONFLICT (slug) DO NOTHING;
