import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
    const teams = await prisma.teamProfile.findMany({
        include: { user: { select: { username: true, is_active: true } } },
        orderBy: { total_score: 'desc' },
    });

    const CATEGORY_COLORS: Record<string, string> = {
        CORE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        WEB: 'bg-blue-500/20 text-blue400 border-blue-500/30',
        ANDROID: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Teams</h1>
                <p className="text-slate-400">
                    {teams.length} team{teams.length !== 1 ? 's' : ''} registered
                </p>
            </div>

            {/* Teams Table */}
            {teams.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                    <p className="text-slate-400">No teams registered yet</p>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Rank
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Team Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Username
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Score
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Penalty
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team, index) => (
                                    <tr
                                        key={team.id}
                                        className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-2xl font-bold text-white">{index + 1}</span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{team.display_name}</div>
                                        </td>

                                        <td className="px-6 py-4 text-slate-400">{team.user.username}</td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded border ${CATEGORY_COLORS[team.category]
                                                    }`}
                                            >
                                                {team.category}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xl font-bold text-green-400">
                                                {team.total_score}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right text-slate-300 font-mono">
                                            {team.total_penalty}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded ${team.user.is_active
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}
                                            >
                                                {team.user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
