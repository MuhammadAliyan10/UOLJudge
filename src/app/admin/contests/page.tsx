import { db as prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ContestsPage() {
    const contests = await prisma.contest.findMany({
        include: {
            _count: {
                select: { problems: true },
            },
        },
        orderBy: { start_time: 'desc' },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Contests</h1>
                    <p className="text-slate-400">
                        {contests.length} contest{contests.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href="/admin/contests/results"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
                >
                    🏆 Ceremony Export
                </Link>
            </div>

            {/* Contests Table */}
            {contests.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                    <p className="text-slate-400">No contests created yet</p>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Dates
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Problems
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">
                                        ID
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {contests.map((contest) => {
                                    const now = new Date();
                                    const isActive = contest.is_active;
                                    const hasStarted = now >= contest.start_time;
                                    const hasEnded = now > contest.end_time;
                                    const isFrozen = contest.frozen_at && now > contest.frozen_at;

                                    let statusColor = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
                                    let statusText = 'Inactive';

                                    if (isActive && !hasStarted) {
                                        statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                                        statusText = 'Scheduled';
                                    } else if (isActive && hasStarted && !hasEnded) {
                                        statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                                        statusText = 'Live';
                                    } else if (hasEnded) {
                                        statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                                        statusText = 'Ended';
                                    }

                                    return (
                                        <tr
                                            key={contest.id}
                                            className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{contest.name}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`px-3 py-1 text-xs font-semibold rounded border ${statusColor}`}
                                                    >
                                                        {statusText}
                                                    </span>
                                                    {isFrozen && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                            ❄️ Frozen
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-slate-300 text-sm">
                                                <div>{contest.start_time.toLocaleString()}</div>
                                                <div className="text-xs text-slate-500">
                                                    to {contest.end_time.toLocaleString()}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right text-slate-300">
                                                {contest._count.problems}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <code className="text-xs text-slate-500 font-mono">
                                                    {contest.id.slice(0, 8)}...
                                                </code>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
