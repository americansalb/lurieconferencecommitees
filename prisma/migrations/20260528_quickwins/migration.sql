-- Quick wins: per-user discussion read state, @mentions, iCal subscription token.

ALTER TABLE "lcc"."lcc_users"
  ADD COLUMN IF NOT EXISTS "icalToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_users_icalToken_key" ON "lcc"."lcc_users"("icalToken");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_discussion_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lcc_discussion_reads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_discussion_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lcc_discussion_reads_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "lcc"."lcc_discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_discussion_reads_userId_discussionId_key" ON "lcc"."lcc_discussion_reads"("userId", "discussionId");
CREATE INDEX IF NOT EXISTS "lcc_discussion_reads_discussionId_idx" ON "lcc"."lcc_discussion_reads"("discussionId");

CREATE TABLE IF NOT EXISTS "lcc"."lcc_mentions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "lcc_mentions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lcc_mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc"."lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lcc_mentions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "lcc"."lcc_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "lcc_mentions_userId_readAt_idx" ON "lcc"."lcc_mentions"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "lcc_mentions_postId_idx" ON "lcc"."lcc_mentions"("postId");
