import { db as prisma } from "@/lib/db";
import Link from "next/link";
import {
  Trophy,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
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
import { CreateContestDialog } from "@/components/admin/contest/CreateContestDialog";
import { ContestActions } from "@/components/admin/contest/ContestActions";
import ContestTableRefresher from "@/components/admin/refreshTable/ContestTableRefresher"; // <-- Client Refresher
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// --- Helper Component: Contest Status Badge (Remains the same) ---
function ContestStatusBadge({ contest }: { contest: any }) {
  const now = new Date();
  const isActive = contest.is_active;
  const hasStarted = now >= contest.start_time;
  const hasEnded = now > contest.end_time;

  if (!isActive) {
    return (
      <Badge
        variant="outline"
        className="bg-slate-50 text-slate-500 border-slate-200 gap-1.5 font-normal"
      >
        <AlertCircle size={12} /> Inactive
      </Badge>
    );
  }

  if (hasEnded) {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 gap-1.5 font-normal"
      >
        Ended
      </Badge>
    );
  }

  if (!hasStarted) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 font-normal"
      >
        <Clock size={12} /> Scheduled
      </Badge>
    );
  }

  // Live
  return (
    <Badge
      variant="outline"
      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 pl-1.5 pr-2.5 font-normal"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      Live
    </Badge>
  );
}

// --- Main Server Component ---
export default async function ContestsPage() {
  // CRITICAL FETCH: Include problems for ManageProblemsDialog
  const contests = await prisma.contest.findMany({
    include: {
      _count: { select: { problems: true } },
      problems: {
        orderBy: { order_index: "asc" },
        select: {
          id: true,
          title: true,
          category: true,
          points: true,
          assets_path: true,
          order_index: true, // Needed for problem mapping
        },
      },
    },
    orderBy: { start_time: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Contests
          </h1>
          <p className="text-slate-500 mt-1">Manage competition schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <CreateContestDialog />
          <Link
            href="/admin/contests/results"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors font-medium shadow-sm"
          >
            <Trophy size={16} /> Export
          </Link>
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <ContestTableRefresher interval={15000}>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="w-[250px]">Contest Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead className="text-center">Problems</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => {
                  const isFrozen =
                    contest.frozen_at && new Date() > contest.frozen_at;

                  return (
                    <TableRow
                      key={contest.id}
                      className="hover:bg-slate-50/50 group"
                    >
                      <TableCell>
                        <code className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-1 rounded">
                          {contest.id.slice(0, 8)}
                        </code>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900">
                            {contest.name}
                          </span>
                          {isFrozen && (
                            <Badge
                              variant="secondary"
                              className="w-fit bg-sky-50 text-sky-700 border-sky-100 gap-1 px-1.5 py-0 font-normal shadow-sm"
                            >
                              ❄️ Frozen
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <ContestStatusBadge contest={contest} />
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-slate-600">
                          <div>
                            Start: {contest.start_time.toLocaleString()}
                          </div>
                          <div>End: {contest.end_time.toLocaleString()}</div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                          {contest._count.problems}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <ContestActions contest={contest} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </ContestTableRefresher>
      </Card>
    </div>
  );
}
