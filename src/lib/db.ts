import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

// CRITICAL FIX (Audit Issue #1): Always cache in global to prevent connection pool exhaustion
// In production with 100+ concurrent users, each serverless invocation would create a new
// PrismaClient, exhausting the 50-connection pool limit. Caching ensures single instance.
globalForPrisma.prisma = db;
