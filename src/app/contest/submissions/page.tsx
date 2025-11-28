import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Verdict } from '@prisma/client';

const VERDICT_COLORS: Record<Verdict, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ACCEPTED: 'bg-green-500/20 text-green-400 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    RUNTIME_ERROR: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    COMPILE_ERROR: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export default async function SubmissionsPage() {
    // Verify authentication
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    // Fetch user's submissions
    const submissions = await prisma.submission.findMany({
        where: { user_id: session.userId },
        include: { problem: true },
        orderBy: { submitted_at: 'desc' },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Submissions</h1>
                <p className="text-slate-400">
                    {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Submissions Table */}
            {submissions.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                    <p className="text-slate-400">No submissions yet</p>
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Problem
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Submitted At
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">
                                        Verdict
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Score
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">
                                        Penalty (min)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((submission) => (
                                    <tr
                                        key={submission.id}
                                        className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                                    >
                                        {/* Problem */}
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">
                                                {submission.problem.title}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {submission.language}
                                            </div>
                                        </td>

                                        {/* Submitted At */}
                                        <td className="px-6 py-4 text-slate-300">
                                            {new Date(submission.submitted_at).toLocaleString()}
                                        </td>

                                        {/* Verdict */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded border ${VERDICT_COLORS[submission.verdict]}`}
                                            >
                                                {submission.verdict}
                                            </span>
                                        </td>

                                        {/* Score */}
                                        <td className="px-6 py-4 text-right">
                                            {submission.verdict === 'ACCEPTED' ? (
                                                <span className="text-lg font-bold text-green-400">
                                                    {submission.final_score}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </td>

                                        {/* Penalty */}
                                        <td className="px-6 py-4 text-right text-slate-300 font-mono">
                                            {submission.verdict === 'ACCEPTED' ? submission.penalty : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Jury Comment (if exists) */}
            {submissions.some((s) => s.jury_comment) && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💬</div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Jury Feedback</h3>
                            {submissions
                                .filter((s) => s.jury_comment)
                                .map((s) => (
                                    <div key={s.id} className="mb-3 last:mb-0">
                                        <p className="text-sm text-slate-400 mb-1">
                                            {s.problem.title}:
                                        </p>
                                        <p className="text-blue-300">{s.jury_comment}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
