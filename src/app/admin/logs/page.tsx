import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
    const logs = await prisma.systemLog.findMany({
        include: { user: { select: { username: true } } },
        orderBy: { timestamp: 'desc' },
        take: 100, // Last 100 logs
    });

    const ACTION_COLORS: Record<string, string> = {
        LOGIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        SUBMISSION: 'bg-green-500/20 text-green-400 border-green-500/30',
        MANUAL_GRADE_UPDATE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        BAN_USER: 'bg-red-500/20 text-red-400 border-red-500/30',
        CONTEST_UPDATE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">System Logs</h1>
                <p className="text-slate-400">Last {logs.length} audit trail entries</p>
            </div>

            {/* Logs Table */}
            {logs.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                    <p className="text-slate-400">No logs recorded yet</p>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Action
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        IP Address
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-slate-400 text-sm font-mono">
                                            {log.timestamp.toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded border ${ACTION_COLORS[log.action] || 'bg-slate-500/20 text-slate-400'
                                                    }`}
                                            >
                                                {log.action}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-white">
                                            {log.user?.username || 'System'}
                                        </td>

                                        <td className="px-6 py-4 text-slate-300 max-w-md truncate">
                                            {log.details}
                                        </td>

                                        <td className="px-6 py-4 text-slate-500 text-sm font-mono">
                                            {log.ip_address || '-'}
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
