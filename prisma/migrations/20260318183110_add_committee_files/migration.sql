-- AlterTable
ALTER TABLE "lcc_events" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "meetingUrl" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Chicago';

-- AlterTable
ALTER TABLE "lcc_posts" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lcc_users" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Chicago';

-- CreateTable
CREATE TABLE "lcc_committee_files" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'link',
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_committee_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lcc_committee_files" ADD CONSTRAINT "lcc_committee_files_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "lcc_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_committee_files" ADD CONSTRAINT "lcc_committee_files_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
