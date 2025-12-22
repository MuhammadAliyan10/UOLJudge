"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInteractiveCeremony } from "@/lib/utils/ceremonyInteractive";

/**
 * Get all completed contests (ended)
 */
export async function getCompletedContests() {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const now = new Date();

  const contests = await db.contest.findMany({
    where: {
      endTime: {
        lt: now,
      },
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: {
      endTime: "desc",
    },
  });

  return contests;
}

/**
 * Generate interactive ceremony HTML for a contest
 */
export async function generateCeremony(contestId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Fetch contest details
  const contest = await db.contest.findUnique({
    where: { id: contestId },
    select: {
      name: true,
      endTime: true,
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  // Fetch team scores for THIS CONTEST ONLY with team profile details
  // CRITICAL FIX: Filter by contestId in query to ensure correct per-contest sorting
  const teamScores = await db.teamScore.findMany({
    where: {
      contestId: contestId, // FIX: Only get teams from this contest
    },
    include: {
      team: {
        select: {
          display_name: true,
          assigned_contest_id: true,
        },
      },
    },
    orderBy: [
      { solvedCount: "desc" }, // 1st: Most problems solved
      { totalScore: "desc" }, // 2nd: Highest total score
      { totalPenalty: "asc" }, // 3rd: Lowest penalty (tiebreaker)
    ],
  });

  // Transform data - contest filtering already done in query above
  const rankings = teamScores
    .filter((score) => score.solvedCount > 0) // Only include teams with at least 1 solved problem
    .map((score, index) => ({
      rank: index + 1,
      teamName: score.team.display_name,
      solvedCount: score.solvedCount,
      totalScore: score.totalScore,
      totalPenalty: score.totalPenalty,
    }));

  // Split into top 3 and honorable mentions
  const top3 = rankings.slice(0, 3);
  const honorableMentions = rankings.slice(3);

  // Generate HTML
  const html = generateInteractiveCeremony({
    contestName: contest.name,
    contestDate: contest.endTime.toLocaleDateString(),
    top3,
    honorableMentions,
  });

  return {
    html,
    filename: `ceremony_${contestId.slice(0, 8)}.html`,
  };
}
