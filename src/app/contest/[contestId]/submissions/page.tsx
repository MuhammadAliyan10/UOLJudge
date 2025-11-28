import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
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
import {
  History,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  // 1. Auth Check
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 2. Fetch Data
  const submissions = await prisma.submission.findMany({
    where: { userId: session.userId },
    include: { problem: true },
    orderBy: { submittedAt: "desc" },
  });

  const feedbackItems = submissions.filter((s) => s.juryComment);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            My Submissions
          </h1>
          <p className="text-slate-500 mt-1">
            Track your submission history and jury feedback.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-500">
          <History size={16} className="text-slate-400" />
          <span className="font-bold text-slate-900">
            {submissions.length}
          </span>{" "}
          Total Attempts
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Section (Left) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <FileCode size={18} className="text-slate-500" />
                Submission Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <History size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">
                    No submissions yet
                  </h3>
                  <p className="text-slate-500 max-w-sm mt-1">
                    Solve a problem to see your history here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead>Problem</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        className="hover:bg-slate-50/50 group"
                      >
                        {/* Problem */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {submission.problem.title}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {submission.fileType || "Unknown"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Time */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-xs font-medium tabular-nums">
                              {new Date(
                                submission.submittedAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Verdict */}
                        {/* <TableCell className="text-right">
                          <VerdictBadge verdict={submission.verdick} />
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feedback Section (Right) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm h-full bg-slate-50/50">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                Jury Feedback
              </CardTitle>
              <CardDescription>
                Comments from admins on your manual reviews.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {feedbackItems.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">
                  No feedback received yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {feedbackItems.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {s.problem.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(s.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded border border-blue-100/50">
                        {s.juryComment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Verdict Component ---

function VerdictBadge({ verdict }: { verdict: SubmissionStatus }) {
  const config: Record<SubmissionStatus, { style: string; icon: any; label: string }> = {
    ACCEPTED: {
      style:
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: CheckCircle2,
      label: "Accepted",
    },
    REJECTED: {
      style: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
      icon: XCircle,
      label: "Wrong Answer",
    },
    PENDING: {
      style: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      icon: Loader2,
      label: "Pending",
    },


  };

  const { style, icon: Icon, label } = config[verdict];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 pl-1.5 pr-2.5 py-0.5 font-medium", style)}
    >
      <Icon size={12} className={verdict === "PENDING" ? "animate-spin" : ""} />
      {label}
    </Badge>
  );
}
