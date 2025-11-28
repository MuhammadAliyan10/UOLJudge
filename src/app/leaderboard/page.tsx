import { db as prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { LeaderboardClient } from './LeaderboardClient';

// ============================================================
// CACHED LEADERBOARD FETCH
// ============================================================

const getLeaderboardData = unstable_cache(
    async () => {
        // Fetch contest for freeze logic
        const contest = await prisma.contest.findFirst({
            where: { is_active: true },
        });

        const teams = await prisma.teamProfile.findMany({
            include: {
                user: {
                    select: { username: true },
                },
            },
            orderBy: [
                { total_score: 'desc' },
                { total_penalty: 'asc' },
            ],
        });

        return { teams, contest };
    },
    ['leaderboard'],
    {
        revalidate: 10, // Cache for 10 seconds
        tags: ['leaderboard'],
    }
);

// ============================================================
// LEADERBOARD PAGE (PUBLIC)
// ============================================================

export default async function LeaderboardPage() {
    const { teams, contest } = await getLeaderboardData();

    // Check if leaderboard is frozen
    const isFrozen = contest?.frozen_at && new Date() > contest.frozen_at;

    return (
        <div className="min-h-screen bg-slate-900 py-8">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
                    <div className="flex items-center gap-4">
                        {contest && (
                            <p className="text-slate-400">
                                Contest: <span className="text-white font-semibold">{contest.name}</span>
                            </p>
                        )}
                        {isFrozen && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-semibold">
                                ❄️  Frozen
                            </span>
                        )}
                    </div>
                </div>

                {/* Leaderboard Table */}
                <LeaderboardClient teams={teams} isFrozen={isFrozen || false} />

                {/* Footer Note */}
                {isFrozen && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-400 text-sm">
                            ℹ️ The leaderboard has been frozen. Rankings are no longer updating publicly.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
