import { db as prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { LeaderboardClient } from "@/app/leaderboard/LeaderboardClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    // <--- MARKED AS PROMISE
    contestId: string;
  }>;
}

export default async function ContestLeaderboardPage({ params }: PageProps) {
  // 1. Await params to extract contestId safely
  const { contestId } = await params;

  if (!contestId) return notFound();

  // --- CACHED DATA FETCH ---
  const getLeaderboardData = unstable_cache(
    async (cId: string) => {
      // Fetch Contest
      const contest = await prisma.contest.findUnique({
        where: { id: cId },
        select: {
          id: true,
          name: true,
          startTime: true, // Add startTime for scheduled state detection
          endTime: true,
          isFrozen: true, // Direct boolean field for freeze status
          problems: {
            select: { id: true, orderIndex: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!contest) return null;

      // Fetch ALL registered teams for this contest (not just those with scores)
      const registeredTeams = await prisma.teamProfile.findMany({
        where: {
          assigned_contest_id: cId,
          is_active: true,
        },
        include: {
          user: {
            select: {
              username: true,
              submissions: {
                where: {
                  status: "ACCEPTED",
                  problem: { contestId: cId },
                },
                select: { problemId: true },
              },
            },
          },
          team_score: {
            where: { contestId: cId },
          },
        },
      });

      // Build leaderboard from ALL registered teams
      let formattedTeams = registeredTeams.map((team) => {
        // Get team score if exists
        const teamScore = team.team_score;

        // Get solved problem indexes
        const solvedProblemIds = new Set(
          team.user.submissions.map((s) => s.problemId)
        );

        const solvedIndexes = contest.problems
          .filter((p) => solvedProblemIds.has(p.id))
          .map((p) => p.orderIndex);

        return {
          id: team.id,
          display_name: team.display_name,
          username: team.user.username,
          category: team.category,
          total_score: teamScore?.totalScore || 0,
          total_penalty: teamScore?.totalPenalty || 0,
          solved_count: teamScore?.solvedCount || 0,
          solved_indexes: solvedIndexes,
        };
      });

      // Sort by: 1. Most Problems Solved (descending) → 2. Lowest Penalty (ascending)
      // This ensures faster solvers rank higher when tied on problem count
      formattedTeams.sort((a, b) => {
        // Primary: Most problems solved wins
        if (b.solved_count !== a.solved_count) {
          return b.solved_count - a.solved_count;
        }
        // Secondary: Lowest penalty wins (faster submission time)
        return a.total_penalty - b.total_penalty;
      });

      return { teams: formattedTeams, contest };
    },
    [`leaderboard-${contestId}`],
    {
      revalidate: 10,
      tags: [`leaderboard-${contestId}`],
    }
  );

  const data = await getLeaderboardData(contestId);

  if (!data) return notFound();

  const { teams, contest } = data;
  // Use the actual isFrozen field from database (not computed from frozenAt)
  const isFrozen = contest.isFrozen ?? false;

  return (
    <LeaderboardClient
      teams={teams}
      contestName={contest.name}
      contestStartTime={contest.startTime}
      contestEndTime={contest.endTime}
      isFrozen={isFrozen}
    />
  );
}
