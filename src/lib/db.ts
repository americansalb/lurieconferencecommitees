import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Bootstrap the in-app scheduler (email queue + reminders, see lib/scheduler)
// from here: db.ts is imported by essentially every server route, so the
// first request after any deploy — including Render's own health check —
// starts the ticker. Deferred + dynamically imported to avoid the module
// cycle (scheduler -> email-queue -> db), and kept out of builds and dev
// (ENABLE_SCHEDULER=1 opts in locally). startScheduler itself is idempotent.
if (
  process.env.NEXT_PHASE !== "phase-production-build" &&
  (process.env.NODE_ENV === "production" || process.env.ENABLE_SCHEDULER === "1")
) {
  setTimeout(() => {
    import("./scheduler")
      .then((m) => m.startScheduler())
      .catch((e) => console.error("[scheduler] failed to start", e));
  }, 5000);
}
