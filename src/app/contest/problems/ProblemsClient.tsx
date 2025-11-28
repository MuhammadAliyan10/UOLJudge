'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Verdict } from '@prisma/client';
import { SubmitDialog } from '@/components/SubmitDialog';

interface Problem {
    id: string;
    order_index: number;
    title: string;
    description: string;
    points: number;
    time_limit_sec: number | null;
    memory_limit_mb: number | null;
    assets_path: string | null;
}

interface ProblemsClientProps {
    problems: Problem[];
    submissionMap: Record<string, Verdict>;
    teamCategory: Category;
    contestEndTime: Date;
}

const VERDICT_COLORS: Record<Verdict, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ACCEPTED: 'bg-green-500/20 text-green-400 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    RUNTIME_ERROR: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    COMPILE_ERROR: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export function ProblemsClient({
    problems,
    submissionMap,
    teamCategory,
    contestEndTime,
}: ProblemsClientProps) {
    const router = useRouter();
    const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

    const handleSubmitSuccess = () => {
        setSelectedProblem(null);
        // CRITICAL: Refresh to show updated submission status
        router.refresh();
    };

    const getLetter = (index: number) => String.fromCharCode(65 + index); // A, B, C...

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Problems</h1>
                <p className="text-slate-400">
                    Category: <span className="text-blue-400 font-semibold">{teamCategory}</span>
                </p>
            </div>

            {/* Problems Grid */}
            {problems.length === 0 ? (
                <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-xl">
                    <p className="text-slate-400">
                        No problems available for your category yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {problems.map((problem) => {
                        const verdict = submissionMap[problem.id];
                        const letter = getLetter(problem.order_index);

                        return (
                            <div
                                key={problem.id}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl font-bold text-blue-400">
                                                {letter}
                                            </span>
                                            {verdict && (
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded border ${VERDICT_COLORS[verdict]}`}
                                                >
                                                    {verdict}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {problem.title}
                                        </h3>
                                    </div>
                                    <span className="text-xl font-bold text-green-400">
                                        {problem.points}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                                    {problem.description}
                                </p>

                                {/* Limits */}
                                <div className="flex gap-4 mb-4 text-xs text-slate-500">
                                    {problem.time_limit_sec && (
                                        <div>⏱️ {problem.time_limit_sec}s</div>
                                    )}
                                    {problem.memory_limit_mb && (
                                        <div>💾 {problem.memory_limit_mb}MB</div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedProblem(problem.id)}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
                                    >
                                        Submit Solution
                                    </button>
                                    {problem.assets_path && (
                                        <button
                                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all"
                                            title="Download assets"
                                        >
                                            📥
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Submit Dialog */}
            {selectedProblem && (
                <SubmitDialog
                    problemId={selectedProblem}
                    category={teamCategory}
                    contestEndTime={contestEndTime}
                    onClose={() => setSelectedProblem(null)}
                    onSuccess={handleSubmitSuccess}
                />
            )}
        </div>
    );
}
