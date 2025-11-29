import { db as prisma } from "@/lib/db";
import { Users, Search, Filter, Shield, Ban, CheckCircle2, MapPin, Hash } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        assigned_contest: { select: { id: true, name: true } },
      },
      orderBy: [{ total_score: "desc" }, { total_penalty: "asc" }],
    });
  },
  ["admin_teams"],
  {
    revalidate: 15,
    tags: ["admin_teams", "leaderboard"],
  }
);

// Helper object for category display
const CATEGORY_STYLES: Record<string, string> = {
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
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
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
            <CreateTeamDialog />
          </div>
        </div>

        {/* Data Grid Card */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-md overflow-hidden ring-1 ring-slate-950/5">
          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search teams..."
                  className="pl-8 h-8 text-sm bg-slate-50 border-slate-200 focus-visible:ring-slate-400 focus-visible:ring-offset-0 rounded-sm"
                />
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-slate-900">
                <Filter className="h-3.5 w-3.5 mr-2" />
                Filters
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <Users size={14} className="text-slate-400" />
              <span>REGISTERED: <strong className="text-slate-900">{teams.length}</strong></span>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Inject the Client Refresher Component */}
            <AdminTableRefresher interval={15000}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                    <TableHead className="w-[80px] text-center h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Rank</TableHead>
                    <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Team Identity</TableHead>
                    <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Contest & Location</TableHead>
                    <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</TableHead>
                    <TableHead className="text-right h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">Score</TableHead>
                    <TableHead className="text-center w-[120px] h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </TableHead>
                    <TableHead className="w-[50px] h-10 py-0"></TableHead>
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
                        assigned_contest_id: team.assigned_contest?.id || null,
                      },
                    };

                    return (
                      <TableRow
                        key={team.id}
                        className="group border-slate-50 hover:bg-slate-50/80 transition-all"
                      >
                        <TableCell className="text-center py-4 align-middle">
                          <div className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded font-mono text-xs font-bold",
                            index === 0 ? "bg-amber-100 text-amber-700" :
                              index === 1 ? "bg-slate-200 text-slate-700" :
                                index === 2 ? "bg-orange-100 text-orange-800" :
                                  "text-slate-400 bg-slate-50"
                          )}>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 text-sm tracking-tight">
                              {team.display_name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Hash size={10} className="text-slate-400" />
                              <code className="text-[10px] text-slate-500 font-mono">
                                {team.user.username}
                              </code>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <div className="flex flex-col gap-1.5">
                            {team.assigned_contest ? (
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                                {team.assigned_contest.name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Unassigned</span>
                            )}
                            {team.lab_location && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <MapPin size={10} />
                                {team.lab_location}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-sm font-mono text-[10px] tracking-wide px-1.5 py-0.5 uppercase",
                              CATEGORY_STYLES[String(team.category) || "CORE"] || "bg-slate-50 text-slate-500 border-slate-200"
                            )}
                          >
                            {team.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4 align-middle">
                          <span className="font-mono font-bold text-slate-900">
                            {team.total_score}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4 align-middle">
                          {team.user.is_active ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                              <CheckCircle2 size={10} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700">
                              <Ban size={10} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Banned</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-4 align-middle">
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
    </div>
  );
}