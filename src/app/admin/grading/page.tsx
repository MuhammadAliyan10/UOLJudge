import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { GradingDialog } from "@/components/GradingDialog";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Inbox, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GradingPage() {
  // 1. Security Check
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "JURY")) {
    redirect("/");
  }

  // 2. Data Fetching
  const submissions = await prisma.submission.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        include: { team_profile: true },
      },
      problem: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Grading Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Review and grade pending submissions from teams.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full animate-pulse",
              submissions.length > 0 ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
          <span className="text-sm font-medium text-slate-700">
            {submissions.length} Pending
          </span>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <Inbox size={20} className="text-slate-500" />
            Submission Queue
          </CardTitle>
          <CardDescription>
            Items are sorted by submission time (newest first).
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500/50" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                All caught up!
              </h3>
              <p className="text-slate-500 max-w-sm mt-1">
                There are no pending submissions to grade at this moment.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px]">Time</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Auto Score</TableHead>
                  <TableHead className="text-right w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-medium font-mono">
                          {getTimeAgo(submission.submittedAt)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {submission.user.team_profile?.display_name ||
                            "Unknown"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          @{submission.user.username}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-slate-700">
                        {submission.problem.title}
                      </span>
                    </TableCell>

                    <TableCell>
                      <CategoryBadge category={submission.problem.category} />
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-sm">
                        {submission.autoScore}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <GradingDialog submission={submission} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Components & Helpers ---

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    CORE: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    WEB: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
    ANDROID:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        styles[category] || "bg-slate-50 text-slate-600"
      )}
    >
      {category}
    </Badge>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
