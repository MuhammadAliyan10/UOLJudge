
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function recalcScores() {
    console.log("🔄 Starting score recalculation...");

    try {
        // 1. Fetch all contests
        const contests = await prisma.contest.findMany({
            include: { problems: true },
        });

        for (const contest of contests) {
            console.log(`\nProcessing Contest: ${contest.name} (${contest.id})`);

            // 2. Fetch all teams assigned to this contest or registered
            // For simplicity, we'll look at all teams that have submissions in this contest
            const teamsWithSubmissions = await prisma.submission.findMany({
                where: {
                    problem: { contestId: contest.id },
                    status: "ACCEPTED"
                },
                select: { userId: true },
                distinct: ['userId']
            });

            const userIds = teamsWithSubmissions.map(s => s.userId);

            const teams = await prisma.teamProfile.findMany({
                where: { user_id: { in: userIds } },
                include: { user: true }
            });

            console.log(`Found ${teams.length} teams with accepted submissions.`);

            for (const team of teams) {
                // 3. Calculate scores for this team in this contest
                const submissions = await prisma.submission.findMany({
                    where: {
                        userId: team.user_id,
                        problem: { contestId: contest.id },
                        status: "ACCEPTED"
                    },
                    include: { problem: true },
                    orderBy: { submittedAt: 'asc' }
                });

                let solvedCount = 0;
                let totalScore = 0;
                let totalPenalty = 0;
                const problemStats: Record<string, any> = {};

                // Track unique problems solved to avoid double counting
                const solvedProblemIds = new Set<string>();

                for (const sub of submissions) {
                    if (solvedProblemIds.has(sub.problemId)) continue;

                    solvedProblemIds.add(sub.problemId);
                    solvedCount++;

                    // Score
                    const score = sub.manualScore || sub.problem.points;
                    totalScore += score;

                    // Penalty
                    const contestStartTime = contest.startTime.getTime();
                    const submittedAt = sub.submittedAt.getTime();
                    const timeTakenMinutes = Math.floor((submittedAt - contestStartTime) / 60000);

                    // Count previous rejections
                    const rejections = await prisma.submission.count({
                        where: {
                            userId: team.user_id,
                            problemId: sub.problemId,
                            status: "REJECTED",
                            submittedAt: { lt: sub.submittedAt }
                        }
                    });

                    const penalty = timeTakenMinutes + (rejections * 20);
                    totalPenalty += penalty;

                    problemStats[sub.problemId] = {
                        solved: true,
                        attempts: rejections + 1,
                        penalty: penalty,
                        score: score
                    };
                }

                // 4. Update TeamScore
                await prisma.teamScore.upsert({
                    where: {
                        teamId_contestId: {
                            teamId: team.id,
                            contestId: contest.id
                        }
                    },
                    update: {
                        solvedCount,
                        totalScore,
                        totalPenalty,
                        problemStats
                    },
                    create: {
                        teamId: team.id,
                        contestId: contest.id,
                        solvedCount,
                        totalScore,
                        totalPenalty,
                        problemStats
                    }
                });

                console.log(`  Updated Team: ${team.display_name} -> Solved: ${solvedCount}, Score: ${totalScore}, Penalty: ${totalPenalty}`);
            }
        }

        console.log("\n✅ Recalculation complete!");
    } catch (error) {
        console.error("❌ Error recalculating scores:", error);
    } finally {
        await prisma.$disconnect();
    }
}

recalcScores();
