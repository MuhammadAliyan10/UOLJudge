"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInteractiveCeremony } from "@/lib/ceremony-interactive";

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

  // Fetch all team scores with team profile details
  // Note: TeamScore has teamId which links to TeamProfile
  const teamScores = await db.teamScore.findMany({
    include: {
      team: {
        select: {
          display_name: true,
          assigned_contest_id: true,
        },
      },
    },
    orderBy: [
      { solvedCount: "desc" },
      { totalPenalty: "asc" },
    ],
  });

  // Filter teams for this contest and transform data
  const rankings = teamScores
    .filter((score) => score.team.assigned_contest_id === contestId)
    .map((score, index) => ({
      rank: index + 1,
      teamName: score.team.display_name,
      solvedCount: score.solvedCount,
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
