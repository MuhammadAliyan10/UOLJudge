import { db as prisma } from "@/lib/db";
import Link from "next/link";
import {
  Trophy,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  ArrowUpRight,
  MoreHorizontal
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/shared/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { Button } from "@/features/shared/ui/button";
import { Input } from "@/features/shared/ui/input";
import { CreateContestDialog } from "@/features/admin/components/contests/CreateContestDialog";
import { ContestActions } from "@/features/admin/components/contests/ContestActions";
import { ContestTimeline } from "@/features/admin/components/contests/ContestTimeline";
import ContestTableRefresher from "@/features/admin/components/refreshTable/ContestTableRefresher";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// --- Helper Component: Contest Status Badge ---
function ContestStatusBadge({ contest }: { contest: any }) {
  const now = new Date();
  const isActive = contest.isActive;
  const hasStarted = now >= contest.startTime;
  const hasEnded = now > contest.endTime;

  if (!isActive) {
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 font-medium rounded-md px-2.5 py-0.5 shadow-sm"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Inactive
      </Badge>
    );
  }

  if (hasEnded) {
    return (
      <Badge
        variant="outline"
        className="bg-slate-50 text-slate-600 border-slate-200 gap-1.5 font-medium rounded-md px-2.5 py-0.5"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Ended
      </Badge>
    );
  }

  if (!hasStarted) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 font-medium rounded-md px-2.5 py-0.5 shadow-sm"
      >
        <Clock size={12} className="text-amber-600" />
        Scheduled
      </Badge>
    );
  }

  // Live
  return (
    <Badge
      variant="outline"
      className="bg-white text-emerald-700 border-emerald-200 gap-2 pl-2 pr-3 font-medium rounded-md shadow-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      Live Now
    </Badge>
  );
}

// --- Main Server Component ---
export default async function ContestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const perPage = 10;

  // CRITICAL FETCH: Include problems for ManageProblemsDialog + add pagination
  const [contests, totalCount] = await Promise.all([
    prisma.contest.findMany({
      include: {
        _count: { select: { problems: true } },
        problems: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            category: true,
            points: true,
            assetsPath: true,
            orderIndex: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contest.count(),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 space-y-8 font-sans text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Contest Management
          </h1>
          <p className="text-slate-500 text-sm max-w-lg">
            Monitor active competitions, schedule upcoming events, and manage problem sets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/contests/results"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-secondary text-white hover:text-white hover:border-primary rounded-md transition-all text-sm font-medium shadow-sm hover:shadow"
          >
            <Trophy size={15} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
            <span>Leaderboards</span>
          </Link>
          <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />
          <CreateContestDialog />
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{totalCount}</span> Total Contests
          </div>

          {/* Mock Search Filter - Visual only for aesthetic, functionality would need client state */}
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by name..."
              className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <ContestTableRefresher interval={15000}>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/80">
                  <TableHead className="w-[120px] py-3 pl-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ID
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contest Details
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Timeline
                  </TableHead>
                  <TableHead className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Problems
                  </TableHead>
                  <TableHead className="w-[80px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => {
                  const isFrozen = contest.frozenAt && new Date() > contest.frozenAt;

                  return (
                    <TableRow
                      key={contest.id}
                      className="group border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="pl-6 py-4 align-top">
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] leading-none text-slate-500 font-mono bg-slate-100 border border-slate-200 px-1.5 py-1 rounded select-all">
                            {contest.id.slice(0, 8)}
                          </code>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                            {contest.name}
                          </span>
                          {isFrozen && (
                            <div className="flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-100 w-fit">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                              </span>
                              Scoreboard Frozen
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 align-top">
                        <div className="mt-0.5">
                          <ContestStatusBadge contest={contest} />
                        </div>
                      </TableCell>

                      <TableCell className="py-4 align-top">
                        <div className="text-sm text-slate-600">
                          <ContestTimeline
                            startTime={contest.startTime}
                            endTime={contest.endTime}
                            isActive={contest.isActive}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-4 align-top">
                        <div className="inline-flex items-center justify-center min-w-[2rem] h-6 px-1.5 mt-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {contest._count.problems}
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-6 py-4 align-top">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ContestActions contest={contest} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <div className="text-xs text-slate-500 font-medium">
                Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`?page=${page - 1}`}
                  className={cn(
                    page === 1 && "pointer-events-none opacity-50"
                  )}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    className="h-8 px-3 bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    Previous
                  </Button>
                </Link>
                <Link
                  href={`?page=${page + 1}`}
                  className={cn(
                    page === totalPages && "pointer-events-none opacity-50"
                  )}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    className="h-8 px-3 bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  >
                    Next
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </CardFooter>
          )}
        </ContestTableRefresher>
      </Card>
    </div>
  );
}