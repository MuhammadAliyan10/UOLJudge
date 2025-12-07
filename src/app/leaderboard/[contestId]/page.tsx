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
          frozenAt: true,
          problems: {
            select: { id: true, orderIndex: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!contest) return null;

      // Fetch TeamScores with 3-tier sorting
      const teamScores = await prisma.teamScore.findMany({
        where: { contestId: cId },
        include: {
          team: {
            select: {
              id: true,
              display_name: true,
              category: true,
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
            },
          },
        },
        orderBy: [
          { solvedCount: "desc" }, // Primary: Most solved
          { totalScore: "desc" }, // Secondary: Highest score
          { totalPenalty: "asc" }, // Tertiary: Fastest time
        ],
      });

      let formattedTeams = teamScores.map((ts) => {
        const solvedProblemIds = new Set(
          ts.team.user.submissions.map((s) => s.problemId)
        );

        const solvedIndexes = contest.problems
          .filter((p) => solvedProblemIds.has(p.id))
          .map((p) => p.orderIndex);

        return {
          id: ts.team.id,
          display_name: ts.team.display_name,
          username: ts.team.user.username,
          category: ts.team.category,
          total_score: ts.totalScore,
          total_penalty: ts.totalPenalty,
          solved_count: ts.solvedCount,
          solved_indexes: solvedIndexes,
        };
      });

      // If no scores yet (Pre-Start), fetch all registered teams
      if (formattedTeams.length === 0) {
        const registeredTeams = await prisma.teamProfile.findMany({
          where: {
            assigned_contest_id: cId,
            is_active: true,
          },
          include: {
            user: { select: { username: true } },
          },
        });

        formattedTeams = registeredTeams.map((team) => ({
          id: team.id,
          display_name: team.display_name,
          username: team.user.username,
          category: team.category,
          total_score: 0,
          total_penalty: 0,
          solved_count: 0,
          solved_indexes: [],
        }));
      }

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
  const isFrozen = contest.frozenAt ? new Date() > contest.frozenAt : false;

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
