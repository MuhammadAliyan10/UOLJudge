'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Verdict } from '@prisma/client';
import { gradeSubmission, getSubmissionPreview } from '@/server/actions/grading';

interface GradingDialogProps {
    submission: {
        id: string;
        auto_score: number;
        file_path: string;
        problem: {
            id: string;
            title: string;
            points: number;
        };
        user: {
            username: string;
            team_profile: {
                display_name: string;
            } | null;
        };
    };
}

export function GradingDialog({ submission }: GradingDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isBinary, setIsBinary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manualScore, setManualScore] = useState<string>('');
    const [juryComment, setJuryComment] = useState('');

    const handleOpen = async () => {
        setIsOpen(true);
        setIsLoading(true);

        // Fetch file preview
        const result = await getSubmissionPreview(submission.id);

        if (result.success) {
            if (result.isBinary) {
                setIsBinary(true);
            } else {
                setFileContent(result.content || '');
            }
        } else {
            setError(result.error || 'Failed to load file');
        }

        setIsLoading(false);
    };

    const handleGrade = async (verdict: Verdict) => {
        setIsLoading(true);
        setError(null);

        const score = manualScore ? parseInt(manualScore) : undefined;

        const result = await gradeSubmission(
            submission.id,
            verdict,
            score,
            juryComment || undefined
        );

        if (result.success) {
            setIsOpen(false);
            router.refresh();
        } else {
            setError(result.error || 'Grading failed');
        }

        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
            >
                Grade
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-6xl bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{submission.problem.title}</h2>
                                <p className="text-slate-400 text-sm">
                                    {submission.user.team_profile?.display_name} ({submission.user.username})
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                            {/* Left: File Preview */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Submission</h3>

                                {isLoading ? (
                                    <div className="bg-slate-950 rounded-lg p-8 text-center text-slate-400">
                                        Loading...
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                                        {error}
                                    </div>
                                ) : isBinary ? (
                                    <div className="bg-slate-950 rounded-lg p-8 text-center">
                                        <div className="text-4xl mb-4">📦</div>
                                        <p className="text-slate-400 mb-4">Binary file (zip/apk)</p>
                                        <a
                                            href={`/api/download/${submission.id}`}
                                            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                                        >
                                            Download File
                                        </a>
                                    </div>
                                ) : (
                                    <pre className="max-h-[400px] overflow-auto p-4 bg-slate-950 text-xs text-slate-300 rounded-lg font-mono">
                                        {fileContent}
                                    </pre>
                                )}
                            </div>

                            {/* Right: Grading Controls */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Grading</h3>

                                <div className="space-y-4">
                                    {/* Auto Score Display */}
                                    <div className="bg-slate-900 rounded-lg p-4">
                                        <div className="text-sm text-slate-400 mb-1">Auto Score (Base)</div>
                                        <div className="text-2xl font-bold text-green-400">
                                            {submission.auto_score} pts
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            Max: {submission.problem.points} pts
                                        </div>
                                    </div>

                                    {/* Manual Override */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Manual Score Override (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={submission.problem.points}
                                            value={manualScore}
                                            onChange={(e) => setManualScore(e.target.value)}
                                            placeholder={`Leave empty to use auto score`}
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Jury Comment (Optional)
                                        </label>
                                        <textarea
                                            value={juryComment}
                                            onChange={(e) => setJuryComment(e.target.value)}
                                            placeholder="Add feedback for the team..."
                                            rows={3}
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Verdict Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => handleGrade('ACCEPTED')}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ✓ Accept
                                        </button>
                                        <button
                                            onClick={() => handleGrade('REJECTED')}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
