import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const stats = await Promise.all([
        prisma.user.count(),
        prisma.teamProfile.count(),
        prisma.contest.count(),
        prisma.problem.count(),
        prisma.submission.count(),
        prisma.systemLog.count(),
    ]);

    const [userCount, teamCount, contestCount, problemCount, submissionCount, logCount] = stats;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
                <p className="text-slate-400">Platform configuration and statistics</p>
            </div>

            {/* System Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">System Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Total Users</div>
                        <div className="text-3xl font-bold text-white">{userCount}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Teams</div>
                        <div className="text-3xl font-bold text-white">{teamCount}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Contests</div>
                        <div className="text-3xl font-bold text-white">{contestCount}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Problems</div>
                        <div className="text-3xl font-bold text-white">{problemCount}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Submissions</div>
                        <div className="text-3xl font-bold text-white">{submissionCount}</div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Audit Logs</div>
                        <div className="text-3xl font-bold text-white">{logCount}</div>
                    </div>
                </div>
            </div>

            {/* Platform Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Platform Details</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Platform Name</span>
                        <span className="text-white font-mono">UOLJudge</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Version</span>
                        <span className="text-white font-mono">3.0.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Environment</span>
                        <span className="text-white font-mono">{process.env.NODE_ENV || 'development'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Database</span>
                        <span className="text-white font-mono">PostgreSQL (Prisma v5.22.0)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Mode</span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                            Offline-First
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
