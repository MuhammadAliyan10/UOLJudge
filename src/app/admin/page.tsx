'use client';

export default function AdminDashboard() {
    // Session will be checked by middleware - if user reaches here, they're authenticated

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome to Admin Dashboard!
                </h1>
                <p className="text-blue-100">
                    Manage contests, teams, and monitor system activity.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl">🏆</div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Active Contests</div>
                            <div className="text-3xl font-bold text-white">0</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        No active contests
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl">👥</div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Registered Teams</div>
                            <div className="text-3xl font-bold text-white">0</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Ready to compete
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl">📝</div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Total Submissions</div>
                            <div className="text-3xl font-bold text-white">0</div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500">
                        Awaiting review
                    </div>
                </div>
            </div>

            {/* Recent Activity (Placeholder) */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                    Recent Activity
                </h2>
                <div className="text-center py-12 text-slate-500">
                    No recent activity to display
                </div>
            </div>
        </div>
    );
}
