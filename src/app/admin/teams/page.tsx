import { db as prisma } from "@/lib/db";
import { Users, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/features/shared/ui/card";
import { Input } from "@/features/shared/ui/input";
import { Button } from "@/features/shared/ui/button";
import { CreateTeamSheet } from "@/features/admin/components/teams/CreateTeamSheet";
import { BulkImportDialog } from "@/features/admin/components/teams/BulkImportDialog";
import { CeremonyExportButton } from "@/features/admin/components/dashboard/CeremonyExportButton";
import { unstable_cache } from "next/cache";
import AdminTableRefresher from "@/features/admin/components/refreshTable/AdminTableRefresher";
import { EmptyState } from "@/features/shared/components/EmptyState";
import { TeamListTable } from "@/features/admin/components/teams/TeamListTable";
import { AdminWebSocketListener } from "@/features/admin/components/AdminWebSocketListener";

export const dynamic = "force-dynamic";

// --- CACHED DATA FETCH ---

const getTeamData = unstable_cache(
  async () => {
    return prisma.teamProfile.findMany({
      select: {
        id: true,
        display_name: true,
        members: true,
        category: true,
        lab_location: true,
        max_devices: true,
        authorized_devices: true,
        is_blocked: true, // Include blocked status for real-time updates
        user: {
          select: {
            id: true,
            username: true,
            is_active: true
          }
        },
        assigned_contest: {
          select: {
            id: true,
            name: true
          }
        },
        team_score: true,
      },
      orderBy: [
        { team_score: { totalScore: "desc" } }, // order by actual totalScore
        { team_score: { totalPenalty: "asc" } }
      ],
    });
  },
  ["admin_teams"],
  {
    revalidate: 15,
    tags: ["admin_teams", "leaderboard"],
  }
);


export default async function TeamsPage() {
  const teams = await getTeamData();

  // Fetch contests for bulk import
  const contests = await prisma.contest.findMany({
    select: { id: true, name: true },
    orderBy: { startTime: "desc" },
  });

  // Get the most recent contest for ceremony export
  const recentContest = contests[0];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
      {/* WebSocket Listener for Real-time Updates */}
      <AdminWebSocketListener />

      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Teams Overview
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Monitor registered teams, scores, and access control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {recentContest && (
              <CeremonyExportButton
                contestId={recentContest.id}
                contestName={recentContest.name}
              />
            )}
            <BulkImportDialog contests={contests} />
            <CreateTeamSheet />
          </div>
        </div>

        {/* Data Grid Card */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-md overflow-hidden ring-1 ring-slate-950/5">
          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 ">
              <Users size={14} className="text-slate-400" />
              <span>REGISTERED: <strong className="text-slate-900">{teams.length}</strong></span>
            </div>
          </div>

          {teams.length === 0 ? (
            <CardContent className="p-6">
              <EmptyState
                icon={Users}
                title="No Teams Registered"
                description="Start by importing teams from a CSV file or create individual team accounts. Teams will appear here once registered."
              />
            </CardContent>
          ) : (
            <CardContent className="p-0">
              {/* Inject the Client Refresher Component */}
              <AdminTableRefresher interval={15000}>
                <div className="p-6">
                  <TeamListTable data={teams} />
                </div>
              </AdminTableRefresher>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
