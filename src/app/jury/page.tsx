import { getAssignedContests } from "@/server/actions/jury/jury-dashboard";
import { getJuryDashboardStats, getRecentLogs } from "@/server/actions/jury/jury-stats";
import { getRetryRequests } from "@/server/actions/submission/retry-system";
import { JuryDashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function JuryDashboard() {
    // Fetch data with error handling to prevent repeated auth errors in logs
    let contests: Awaited<ReturnType<typeof getAssignedContests>> = [];
    let stats: Awaited<ReturnType<typeof getJuryDashboardStats>> = {
        totalTeams: 0,
        pendingSubmissions: 0,
        retryRequests: 0,
        gradedToday: 0
    };
    let retryRequests: Awaited<ReturnType<typeof getRetryRequests>> = [];
    let recentLogs: Awaited<ReturnType<typeof getRecentLogs>> = [];

    try {
        [contests, stats, retryRequests, recentLogs] = await Promise.all([
            getAssignedContests(),
            getJuryDashboardStats(),
            getRetryRequests(),
            getRecentLogs(15),
        ]);
    } catch (error) {
        // Silently handle - layout already does auth check
        console.error("Error loading dashboard data:", error instanceof Error ? error.message : error);
    }

    return (
        <JuryDashboardClient
            initialContests={contests}
            initialStats={stats}
            initialRetryRequests={retryRequests}
            initialRecentLogs={recentLogs}
        />
    );
}
