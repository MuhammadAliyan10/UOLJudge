import { db } from "@/lib/db";
import Link from "next/link";
import {
  Trophy,
  Users,
  FileText,
  Activity,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";

// Server Component (Direct DB Access)
export default async function AdminDashboard() {
  // 1. Fetch Real-Time Stats
  const activeContests = await db.contest.count({
    where: { is_active: true },
  });

  const totalTeams = await db.teamProfile.count();

  const pendingSubmissions = await db.submission.count({
    where: { verdict: "PENDING" },
  });

  // 2. Fetch Recent Logs (Last 5)
  const recentLogs = await db.systemLog.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
    include: { user: true },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Admin Control Center
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Monitor the competition health, manage teams, and oversee the
            grading pipeline in real-time.
          </p>
        </div>
        {/* Decorative Gradient Blob */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-bl from-blue-50 to-transparent opacity-50 pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Contests"
          value={activeContests}
          icon={Trophy}
          color="text-blue-600"
          bg="bg-blue-50"
          desc="Running right now"
        />
        <StatCard
          title="Registered Teams"
          value={totalTeams}
          icon={Users}
          color="text-emerald-600"
          bg="bg-emerald-50"
          desc="Ready to compete"
        />
        <StatCard
          title="Pending Reviews"
          value={pendingSubmissions}
          icon={FileText}
          color="text-amber-600"
          bg="bg-amber-50"
          desc="Awaiting jury grading"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-slate-400" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard
              href="/admin/teams"
              title="Manage Teams"
              desc="Add new participants or edit profiles"
              icon={Users}
            />
            <ActionCard
              href="/admin/contests"
              title="Contest Settings"
              desc="Create or freeze competitions"
              icon={Trophy}
            />
            <ActionCard
              href="/admin/grading"
              title="Jury Grading"
              desc="Grade pending code submissions"
              icon={FileText}
              highlight={pendingSubmissions > 0} // Highlights if work is needed
            />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">System Logs</h3>
            <Link
              href="/admin/logs"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-6">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No recent activity
              </p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="mt-1 min-w-[8px] h-2 rounded-full bg-slate-300" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function StatCard({ title, value, icon: Icon, color, bg, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex items-start justify-between hover:border-slate-300 transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        <p className="text-xs text-slate-400 mt-2">{desc}</p>
      </div>
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function ActionCard({ href, title, desc, icon: Icon, highlight }: any) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
        ${
          highlight
            ? "bg-amber-50 border-amber-200 hover:border-amber-300"
            : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
        }
      `}
    >
      <div
        className={`
        p-3 rounded-lg transition-colors
        ${
          highlight
            ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
        }
      `}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4
          className={`font-semibold ${
            highlight ? "text-amber-900" : "text-slate-800"
          }`}
        >
          {title}
        </h4>
        <p
          className={`text-sm ${
            highlight ? "text-amber-700/80" : "text-slate-500"
          }`}
        >
          {desc}
        </p>
      </div>
      <div
        className={`
        opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0
        ${highlight ? "text-amber-600" : "text-blue-600"}
      `}
      >
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
