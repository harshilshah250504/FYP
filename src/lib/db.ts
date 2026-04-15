import { PrismaClient } from "@prisma/client";
import { setupCronJobs } from "./cron";

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient,
  cronStarted?: boolean 
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (!globalForPrisma.cronStarted) {
  setupCronJobs();
  globalForPrisma.cronStarted = true;
}
