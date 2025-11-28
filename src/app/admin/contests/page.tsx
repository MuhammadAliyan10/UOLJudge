import { db as prisma } from "@/lib/db";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
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
import { CreateContestDialog } from "@/components/admin/CreateContestDialog";
import { ContestActions } from "@/components/admin/ContestActions";

export const dynamic = "force-dynamic";

export default async function ContestsPage() {
  const contests = await prisma.contest.findMany({
    include: {
      _count: { select: { problems: true } },
      problems: {
        // <--- ADD THIS INCLUDE
        orderBy: { order_index: "asc" },
      },
    },
    orderBy: { start_time: "desc" },
  });

  return (
    <div className="space-y-6">
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

      <Card className="border-slate-200 shadow-sm overflow-hidden">
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
                const now = new Date();
                const isActive = contest.is_active;
                const hasStarted = now >= contest.start_time;
                const hasEnded = now > contest.end_time;
                const isFrozen = contest.frozen_at && now > contest.frozen_at;

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
                            className="w-fit bg-sky-50 text-sky-700"
                          >
                            ❄️ Frozen
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Status Badge Logic reused for brevity */}
                      {!isActive ? (
                        <Badge variant="outline" className="text-slate-500">
                          <AlertCircle size={12} /> Inactive
                        </Badge>
                      ) : hasEnded ? (
                        <Badge
                          variant="outline"
                          className="text-red-700 border-red-200"
                        >
                          Ended
                        </Badge>
                      ) : !hasStarted ? (
                        <Badge
                          variant="outline"
                          className="text-amber-700 border-amber-200"
                        >
                          <Clock size={12} /> Scheduled
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-emerald-700 border-emerald-200 bg-emerald-50"
                        >
                          <CheckCircle2 size={12} /> Live
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div>Start: {contest.start_time.toLocaleString()}</div>
                        <div>End: {contest.end_time.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
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
      </Card>
    </div>
  );
}
