/**
 * CONSOLIDATION: Re-export db as prisma for backward compatibility
 * This ensures all files use the same single Prisma client instance
 * regardless of whether they import 'prisma' or 'db'
 */
import { db } from "./db";
export const prisma = db;
