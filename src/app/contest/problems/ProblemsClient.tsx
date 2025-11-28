"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, SubmissionStatus } from "@prisma/client";
import { SubmitDialog } from "@/components/SubmitDialog";
import {
  Clock,
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileCode,
  Trophy,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  points: number;
  timeLimitSec: number | null;
  memoryLimitMb: number | null;
  assetsPath: string | null;
}

interface ProblemsClientProps {
  problems: Problem[];
  submissionMap: Record<string, SubmissionStatus>;
  teamCategory: Category;
  contestEndTime: Date;
}

export function ProblemsClient({
  problems,
  submissionMap,
  teamCategory,
  contestEndTime,
}: ProblemsClientProps) {
  const router = useRouter();
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  const handleSubmitSuccess = () => {
    setSelectedProblem(null);
    router.refresh();
  };

  const getLetter = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="space-y-8 pb-12">
      {/* Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Problems
            <Badge
              variant="outline"
              className="text-sm font-medium text-slate-500 border-slate-200"
            >
              {teamCategory}
            </Badge>
          </h1>
          <p className="text-slate-500 mt-1">
            Solve the tasks below to earn points.
          </p>
        </div>

        <div className="text-right hidden md:block">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {problems.length}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Tasks
          </div>
        </div>
      </div>

      {/* Grid */}
      {problems.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <FileCode size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No problems available
            </h3>
            <p className="text-slate-500">Wait for the contest to begin.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => {
            const verdict = submissionMap[problem.id];
            const letter = getLetter(problem.orderIndex);

            // Status Logic (Subtle Borders)
            const isSolved = verdict === "ACCEPTED";
            const isFailed = verdict === "REJECTED";
            const isPending = verdict === "PENDING";

            return (
              <Card
                key={problem.id}
                className={cn(
                  "flex flex-col h-full transition-all duration-200 group border shadow-sm hover:shadow-md",
                  isSolved
                    ? "border-emerald-200 bg-emerald-50/30"
                    : isFailed
                      ? "border-red-200 bg-red-50/30"
                      : "border-slate-200 bg-white"
                )}
              >
                <CardHeader className="pb-3 pt-5">
                  <div className="flex justify-between items-start gap-4">
                    {/* Letter Box */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold shadow-sm shrink-0",
                        isSolved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {letter}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-slate-900 leading-tight truncate"
                        title={problem.title}
                      >
                        {problem.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 h-5 text-[10px] font-bold bg-slate-100 text-slate-600 border-slate-200"
                        >
                          {problem.points} PTS
                        </Badge>
                        {verdict && <VerdictText verdict={verdict} />}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 py-2">
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {problem.description}
                  </p>

                  {/* Tech Specs */}
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-50/50 p-2 rounded border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> {problem.timeLimitSec || "N/A"}s
                    </span>
                    <span className="w-px h-3 bg-slate-200" />
                    <span className="flex items-center gap-1.5">
                      <HardDrive size={12} /> {problem.memoryLimitMb || "N/A"}
                      MB
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-5 gap-2">
                  <Button
                    onClick={() => !isSolved && setSelectedProblem(problem.id)}
                    disabled={isSolved} // <--- DISABLED IF SOLVED
                    className={cn(
                      "flex-1 gap-2 shadow-sm",
                      isSolved
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-not-allowed opacity-100"
                        : "bg-primary hover:bg-primary/90 text-white"
                    )}
                    variant={isSolved ? "outline" : "default"}
                  >
                    {isSolved ? (
                      <>
                        <CheckCircle2 size={16} /> Completed
                      </>
                    ) : (
                      <>
                        Submit <ArrowUpRight size={16} className="opacity-70" />
                      </>
                    )}
                  </Button>

                  {problem.assetsPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a
                        href={`/api/problems/assets/${problem.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download size={14} />
                        View PDF
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedProblem && (
        <SubmitDialog
          problemId={selectedProblem}
          category={teamCategory}
          contestEndTime={contestEndTime}
          onClose={() => setSelectedProblem(null)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
}

// Minimalist Text Verdict
function VerdictText({ verdict }: { verdict: SubmissionStatus }) {
  if (verdict === "ACCEPTED")
    return (
      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
        Solved
      </span>
    );
  if (verdict === "REJECTED")
    return (
      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
        Failed
      </span>
    );
  if (verdict === "PENDING")
    return (
      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide animate-pulse">
        Pending
      </span>
    );
  return (
    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">
      Error
    </span>
  );
}
