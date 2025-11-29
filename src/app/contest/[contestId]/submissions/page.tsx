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
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  // 1. Auth Check
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { contestId } = await params;

  // 2. Fetch Data (Filtered by Contest)
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.userId,
      problem: {
        contestId: contestId
      }
    },
    include: { problem: true },
    orderBy: { submittedAt: "desc" },
  });

  const feedbackItems = submissions.filter((s) => s.juryComment);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Submissions
          </h1>
          <p className="text-slate-500 mt-1 text-lg">
            Track your submission history and jury feedback.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-500">
          <History size={18} className="text-blue-500" />
          <span className="font-bold text-slate-900 text-lg">
            {submissions.length}
          </span>{" "}
          Total Attempts
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Section (Left) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
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
                    <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/30">
                      <TableHead className="font-semibold text-slate-600">Problem</TableHead>
                      <TableHead className="font-semibold text-slate-600">Time</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600">Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        className="hover:bg-slate-50/80 group transition-colors border-slate-100"
                      >
                        {/* Problem */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                              {submission.problem.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                {submission.fileType || "Unknown"}
                              </span>
                              {/* Download Link (Optional) */}
                              <Link href={`/api/download/${submission.id}`} target="_blank" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download size={12} className="text-slate-400 hover:text-blue-600" />
                              </Link>
                            </div>
                          </div>
                        </TableCell>

                        {/* Time */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-sm font-medium tabular-nums">
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
                        <TableCell className="text-right">
                          <VerdictBadge verdict={submission.status} />
                        </TableCell>
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
            <CardHeader className="border-b border-slate-100 bg-white py-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                Jury Feedback
              </CardTitle>
              <CardDescription>
                Comments from admins on your manual reviews.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-4">
              {feedbackItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare size={24} className="text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400 italic">
                    No feedback received yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackItems.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className="text-sm font-bold text-slate-900 line-clamp-1">
                          {s.problem.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                          {new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 ml-2">
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

  const { style, icon: Icon, label } = config[verdict] || config.PENDING;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 pl-1.5 pr-2.5 py-0.5 font-medium transition-colors", style)}
    >
      <Icon size={12} className={verdict === "PENDING" ? "animate-spin" : ""} />
      {label}
    </Badge>
  );
}
