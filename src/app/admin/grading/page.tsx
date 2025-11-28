import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { GradingDialog } from '@/components/GradingDialog';
import { redirect } from 'next/navigation';

export default async function GradingPage() {
    // Verify admin/jury role
    const session = await getSession();

    if (!session || (session.role !== 'ADMIN' && session.role !== 'JURY')) {
        redirect('/');
    }

    // Fetch pending submissions
    const submissions = await prisma.submission.findMany({
        where: { verdict: 'PENDING' },
        include: {
            user: {
                include: { team_profile: true },
            },
            problem: true,
        },
        orderBy: { submitted_at: 'desc' },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Grading Dashboard</h1>
                <p className="text-slate-400">
                    {submissions.length} pending submission{submissions.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Submissions Table */}
            {submissions.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                    <p className="text-slate-400">No pending submissions</p>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-700">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Team
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Problem
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Auto Score
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((submission) => {
                                    const timeAgo = getTimeAgo(submission.submitted_at);

                                    return (
                                        <tr
                                            key={submission.id}
                                            className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                                        >
                                            {/* Time */}
                                            <td className="px-4 py-3 text-sm text-slate-300">
                                                {timeAgo}
                                            </td>

                                            {/* Team */}
                                            <td className="px-4 py-3">
                                                <div className="text-white font-medium">
                                                    {submission.user.team_profile?.display_name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {submission.user.username}
                                                </div>
                                            </td>

                                            {/* Problem */}
                                            <td className="px-4 py-3 text-white">
                                                {submission.problem.title}
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getCategoryColor(submission.problem.category)}`}>
                                                    {submission.problem.category}
                                                </span>
                                            </td>

                                            {/* Auto Score */}
                                            <td className="px-4 py-3 text-right text-green-400 font-bold">
                                                {submission.auto_score}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <GradingDialog submission={submission} />
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

// Helper functions
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        CORE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        WEB: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        ANDROID: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}
