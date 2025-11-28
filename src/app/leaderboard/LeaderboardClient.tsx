'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@prisma/client';

interface Team {
    id: string;
    display_name: string;
    category: Category;
    total_score: number;
    total_penalty: number;
    user: {
        username: string;
    };
}

interface LeaderboardClientProps {
    teams: Team[];
    isFrozen: boolean;
}

const CATEGORY_COLORS: Record<Category, string> = {
    CORE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    WEB: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ANDROID: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const RANK_COLORS: Record<number, string> = {
    1: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50',
    2: 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50',
    3: 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50',
};

export function LeaderboardClient({ teams, isFrozen }: LeaderboardClientProps) {
    const router = useRouter();

    // Auto-refresh every 10 seconds (unless frozen)
    useEffect(() => {
        if (isFrozen) return;

        const interval = setInterval(() => {
            router.refresh();
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [router, isFrozen]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-700">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Rank
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Team
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Score
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Penalty (min)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, index) => {
                            const rank = index + 1;
                            const rankStyle = RANK_COLORS[rank] || '';

                            return (
                                <tr
                                    key={team.id}
                                    className={`border-b border-slate-700 transition-all hover:bg-slate-700/50 ${rankStyle}`}
                                >
                                    {/* Rank */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-white">
                                                {rank}
                                            </span>
                                            {rank === 1 && <span>🥇</span>}
                                            {rank === 2 && <span>🥈</span>}
                                            {rank === 3 && <span>🥉</span>}
                                        </div>
                                    </td>

                                    {/* Team Name */}
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">
                                            {team.display_name}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            {team.user.username}
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[team.category]
                                                }`}
                                        >
                                            {team.category}
                                        </span>
                                    </td>

                                    {/* Score */}
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-2xl font-bold text-green-400">
                                            {team.total_score}
                                        </span>
                                    </td>

                                    {/* Penalty */}
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-lg font-mono text-slate-300">
                                            {team.total_penalty}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {teams.length === 0 && (
                <div className="py-12 text-center">
                    <p className="text-slate-400">No teams registered yet.</p>
                </div>
            )}
        </div>
    );
}
