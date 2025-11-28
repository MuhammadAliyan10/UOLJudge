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
      // Fetch Specific Contest
      const contest = await prisma.contest.findUnique({
        where: { id: cId },
        include: {
          problems: {
            select: { id: true, order_index: true, category: true },
            orderBy: { order_index: "asc" },
          },
        },
      });

      if (!contest) return null;

      const contestCategories = Array.from(
        new Set(contest.problems.map((p) => p.category))
      );

      const teams = await prisma.teamProfile.findMany({
        where: {
          category: { in: contestCategories },
        },
        include: {
          user: {
            include: {
              submissions: {
                where: {
                  verdict: "ACCEPTED",
                  problem: { contest_id: cId },
                },
                select: { problem_id: true },
              },
            },
          },
        },
      });

      const formattedTeams = teams.map((team) => {
        const solvedProblemIds = new Set(
          team.user.submissions.map((s) => s.problem_id)
        );

        const solvedIndexes = contest.problems
          .filter((p) => solvedProblemIds.has(p.id))
          .map((p) => p.order_index);

        const contestScore = contest.problems
          .filter((p) => solvedProblemIds.has(p.id))
          .reduce((acc, curr) => acc + 100, 0); // Or use real points

        return {
          id: team.id,
          display_name: team.display_name,
          username: team.user.username,
          category: team.category,
          total_score: contestScore,
          total_penalty: team.total_penalty,
          solved_indexes: solvedIndexes,
        };
      });

      formattedTeams.sort(
        (a, b) =>
          b.total_score - a.total_score || a.total_penalty - b.total_penalty
      );

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
  const isFrozen = contest.frozen_at ? new Date() > contest.frozen_at : false;

  return (
    <LeaderboardClient
      teams={teams}
      contestName={contest.name}
      contestEndTime={contest.end_time}
      isFrozen={isFrozen}
    />
  );
}
