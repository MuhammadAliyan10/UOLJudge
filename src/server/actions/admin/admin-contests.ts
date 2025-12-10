"use server";

import { db as prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Get ALL contests (no isActive filter) for team assignment
 * This is different from getAllContestsForAssignment which only returns active contests
 */
export async function getAllContestsForTeamAssignment(): Promise<
  Array<{ id: string; name: string }>
> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return [];
  }

  try {
    const contests = await prisma.contest.findMany({
      // NO isActive filter - returns ALL contests for team assignment
      select: {
        id: true,
        name: true,
      },
      orderBy: { startTime: "desc" },
    });

    return contests;
  } catch (error) {
    console.error("[getAllContestsForTeamAssignment] Error:", error);
    return [];
  }
}
