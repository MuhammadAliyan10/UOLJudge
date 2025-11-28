'use client';

export default function ContestPage() {
    // Session will be checked by middleware - if user reaches here, they're authenticated

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome to UOLJudge Contest!
                </h1>
                <p className="text-green-100">
                    Good luck! Read the rules and start solving problems.
                </p>
            </div>

            {/* Contest Rules */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">📖 Contest Rules</h2>
                <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        Solve as many problems as possible within the time limit
                    </li>
                    <li className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        Submit your solutions through the &quot;Problems&quot; tab
                    </li>
                    <li className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        Check the &quot;Leaderboard&quot; to see team rankings
                    </li>
                    <li className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        Use &quot;Clarifications&quot; if you have questions about a problem
                    </li>
                    <li className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        Time penalties apply for incorrect submissions
                    </li>
                </ul>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all cursor-pointer">
                    <div className="text-4xl mb-3">📝</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        View Problems
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Browse available problems and submit solutions
                    </p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500 transition-all cursor-pointer">
                    <div className="text-4xl mb-3">🏆</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Leaderboard
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Check your ranking and see how other teams are doing
                    </p>
                </div>
            </div>

            {/* Contest Status */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                    📊 Your Progress
                </h2>
                <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="text-3xl font-bold text-blue-400">0</div>
                        <div className="text-sm text-slate-400 mt-1">Problems Solved</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-green-400">0</div>
                        <div className="text-sm text-slate-400 mt-1">Total Score</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-yellow-400">--</div>
                        <div className="text-sm text-slate-400 mt-1">Current Rank</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
