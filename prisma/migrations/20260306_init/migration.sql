-- CreateTable
CREATE TABLE IF NOT EXISTS "lcc_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lcc_committees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "icon" TEXT NOT NULL DEFAULT 'users',

    CONSTRAINT "lcc_committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lcc_committee_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lcc_events" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lcc_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lcc_discussions" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lcc_posts" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_users_email_key" ON "lcc_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_committees_name_key" ON "lcc_committees"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_committees_slug_key" ON "lcc_committees"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_committee_members_userId_committeeId_key" ON "lcc_committee_members"("userId", "committeeId");

-- AddForeignKey
ALTER TABLE "lcc_committee_members" ADD CONSTRAINT "lcc_committee_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_committee_members" ADD CONSTRAINT "lcc_committee_members_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "lcc_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_events" ADD CONSTRAINT "lcc_events_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "lcc_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_discussions" ADD CONSTRAINT "lcc_discussions_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "lcc_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_discussions" ADD CONSTRAINT "lcc_discussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_posts" ADD CONSTRAINT "lcc_posts_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "lcc_discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_posts" ADD CONSTRAINT "lcc_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
