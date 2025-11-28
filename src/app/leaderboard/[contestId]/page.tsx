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
            select: { id: true, orderIndex: true, category: true },
            orderBy: { orderIndex: "asc" },
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
                  status: "ACCEPTED",
                  problem: { contestId: cId },
                },
                select: { problemId: true },
              },
            },
          },
        },
      });

      const formattedTeams = teams.map((team) => {
        const solvedProblemIds = new Set(
          team.user.submissions.map((s) => s.problemId)
        );

        const solvedIndexes = contest.problems
          .filter((p) => solvedProblemIds.has(p.id))
          .map((p) => p.orderIndex);

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
  const isFrozen = contest.frozenAt ? new Date() > contest.frozenAt : false;

  return (
    <LeaderboardClient
      teams={teams}
      contestName={contest.name}
      contestEndTime={contest.endTime}
      isFrozen={isFrozen}
    />
  );
}
