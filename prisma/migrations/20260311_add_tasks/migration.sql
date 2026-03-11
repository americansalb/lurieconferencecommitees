-- CreateTable: tasks for Gantt chart
CREATE TABLE "lcc_tasks" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "color" TEXT,
    "url" TEXT,
    "assigneeId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "lcc_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lcc_tasks" ADD CONSTRAINT "lcc_tasks_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "lcc_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lcc_tasks" ADD CONSTRAINT "lcc_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "lcc_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
