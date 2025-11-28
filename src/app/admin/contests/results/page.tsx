'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateCeremonyHTML } from '@/server/actions/ceremony';
import { toast } from 'sonner';

export default function CeremonyResultsPage() {
    const router = useRouter();
    const [contestId, setContestId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!contestId) {
            toast.error('Please enter a contest ID');
            return;
        }

        setIsGenerating(true);
        toast.loading('Generating ceremony HTML...');

        try {
            const result = await generateCeremonyHTML(contestId);

            if (!result.success) {
                toast.error(result.error || 'Failed to generate ceremony');
                return;
            }

            // Create Blob and trigger download
            const blob = new Blob([result.html!], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'UOL_FINAL_RESULTS.html';
            a.click();

            URL.revokeObjectURL(url);

            toast.success('Ceremony file downloaded successfully!');
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsGenerating(false);
            toast.dismiss();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Award Ceremony Export</h1>
                <p className="text-slate-400">
                    Generate a self-contained HTML file for the offline award ceremony
                </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-2xl">
                <div className="space-y-6">
                    {/* Contest ID Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Contest ID
                        </label>
                        <input
                            type="text"
                            value={contestId}
                            onChange={(e) => setContestId(e.target.value)}
                            placeholder="Enter contest UUID"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Get the contest ID from the Contests page
                        </p>
                    </div>

                    {/* Download Button */}
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating || !contestId}
                        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {isGenerating ? 'Generating...' : '🏆 Download Ceremony HTML'}
                    </button>

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">File Features:</h3>
                        <ul className="text-xs text-slate-400 space-y-1">
                            <li>✓ Self-contained (no internet required)</li>
                            <li>✓ Spacebar reveal animation</li>
                            <li>✓ CSS confetti for gold reveal</li>
                            <li>✓ Embedded UOL logo</li>
                            <li>✓ File size &lt;2MB</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
