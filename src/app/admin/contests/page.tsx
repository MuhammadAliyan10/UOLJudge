import { db as prisma } from "@/lib/db";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/features/shared/ui/card";
import { CreateContestSheet } from "@/features/admin/components/contests/CreateContestSheet";
import { DataTable } from "@/features/shared/components/ui/data-table";
import { columns } from "@/features/admin/components/contests/columns";
import { EmptyState } from "@/features/shared/components/EmptyState";

export const dynamic = "force-dynamic";

// --- Main Server Component ---
export default async function ContestsPage() {
  // CRITICAL FETCH: Include problems for ManageProblemsDialog
  const contests = await prisma.contest.findMany({
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      isActive: true,
      frozenAt: true,
      category: true, // BUG FIX: Fetch contest category for ManageProblemsDialog
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
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 space-y-8 font-sans text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Contest Management
          </h1>
          <p className="text-slate-500 text-sm max-w-lg">
            Monitor active competitions, schedule upcoming events, and manage
            problem sets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/contests/results"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-secondary text-white hover:text-white hover:border-primary rounded-md transition-all text-sm font-medium shadow-sm hover:shadow"
          >
            <Trophy
              size={15}
              className="text-slate-400 group-hover:text-amber-500 transition-colors"
            />
            <span>Leaderboards</span>
          </Link>
          <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />
          <CreateContestSheet />
        </div>
      </div>

      {/* Main Content Table */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
        {contests.length === 0 ? (
          <CardContent className="p-6">
            <EmptyState
              icon={Trophy}
              title="No Contests Found"
              description="Get started by creating your first contest. You can configure problems, set time limits, and manage participants all from the admin panel."
            />
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <DataTable columns={columns} data={contests} filterColumn="name" />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
