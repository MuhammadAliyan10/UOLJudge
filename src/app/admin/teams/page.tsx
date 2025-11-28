import { db as prisma } from "@/lib/db";
import { Users, CheckCircle2, Ban, MoreHorizontal, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CreateTeamDialog } from "@/components/admin/CreateTeamDialog";
import { TeamActions } from "@/components/admin/TeamActions";
import { BulkImportDialog } from "@/components/admin/BulkImportDialog";
import { CeremonyExportButton } from "@/components/admin/CeremonyExportButton";
import { unstable_cache } from "next/cache";
import AdminTableRefresher from "@/components/admin/refreshTable/AdminTableRefresher";

export const dynamic = "force-dynamic";

// --- CACHED DATA FETCH ---
const getTeamData = unstable_cache(
  async () => {
    return prisma.teamProfile.findMany({
      include: {
        user: { select: { id: true, username: true, is_active: true } },
      },
      orderBy: [{ total_score: "desc" }, { total_penalty: "asc" }],
    });
  },
  ["admin_teams"],
  {
    revalidate: 15, // Refresh the list every 15 seconds automatically
    tags: ["admin_teams", "leaderboard"], // Use leaderboard tag for grading updates
  }
);

// Helper object for category display
const CATEGORY_COLORS: Record<string, string> = {
  CORE: "bg-purple-50 text-purple-700 border-purple-200",
  WEB: "bg-blue-50 text-blue-700 border-blue-200",
  ANDROID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Teams Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor registered teams and status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Users size={16} className="text-slate-400" />
            <span className="font-bold text-slate-900">{teams.length}</span>
            <span className="text-slate-500 text-sm">Teams</span>
          </div>
          {recentContest && (
            <CeremonyExportButton
              contestId={recentContest.id}
              contestName={recentContest.name}
            />
          )}
          <BulkImportDialog contests={contests} />
          <CreateTeamDialog />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Inject the Client Refresher Component */}
          <AdminTableRefresher interval={15000}>
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[80px] text-center">Rank</TableHead>
                  <TableHead>Team Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-center w-[120px]">
                    Status
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team, index) => {
                  const teamForEdit = {
                    id: team.user.id,
                    username: team.user.username,
                    is_active: team.user.is_active,
                    team_profile: {
                      display_name: team.display_name,
                      category: team.category,
                      lab_location: team.lab_location,
                    },
                  };

                  const rankStyle =
                    index < 3
                      ? index === 0
                        ? "bg-yellow-50 text-yellow-800 font-bold"
                        : index === 1
                          ? "bg-slate-200 text-slate-700 font-bold"
                          : "bg-orange-100 text-orange-800 font-bold"
                      : "text-slate-500";

                  return (
                    <TableRow
                      key={team.id}
                      className="hover:bg-slate-50/50 group"
                    >
                      <TableCell className="text-center font-medium">
                        <span
                          className={
                            rankStyle === "text-slate-500"
                              ? ""
                              : "px-3 py-1 rounded"
                          }
                        >
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {team.display_name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-xs text-slate-500 font-mono bg-slate-100 px-1 rounded">
                              @{team.user.username}
                            </code>
                            {team.lab_location && (
                              <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 rounded">
                                {team.lab_location}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            CATEGORY_COLORS[String(team.category) || "CORE"] ||
                            ""
                          }
                        >
                          {team.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {team.total_score}
                      </TableCell>
                      <TableCell className="text-center">
                        {team.user.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            Banned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <TeamActions team={teamForEdit} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AdminTableRefresher>
        </CardContent>
      </Card>
    </div>
  );
}
