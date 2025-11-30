import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PausedOverlay } from "@/features/contest/components/PausedOverlay";
import { PreContestPage } from "./PreContestPage";
import { PostContestPage } from "./PostContestPage";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProblemsPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;

  // 1. Auth Check
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // 2. Fetch Team Profile
  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
  });

  if (!teamProfile) {
    return <div>Profile Error</div>;
  }

  // 3. Find the contest
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        where: { category: teamProfile.category },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!contest) {
    return <div>Contest Not Found</div>;
  }

  // 4. Check Pause State
  if (contest.isPaused) {
    return <PausedOverlay pausedAt={contest.pausedAt} />;
  }

  // 5. Check contest state (Pre-start, Active, or Ended)
  const now = new Date();
  const hasStarted = now >= contest.startTime;
  const hasEnded = now > contest.endTime;

  if (!hasStarted) {
    return (
      <PreContestPage
        contestName={contest.name}
        startTime={contest.startTime}
        contestId={contest.id}
      />
    );
  }

  // if (hasEnded) {
  //   return (
  //     <PostContestPage
  //       contestName={contest.name}
  //       endTime={contest.endTime}
  //       contestId={contest.id}
  //     />
  //   );
  // }

  // 6. Fetch Submissions for Status
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.userId,
      problemId: { in: contest.problems.map((p) => p.id) },
    },
    orderBy: { submittedAt: "desc" },
    distinct: ["problemId"],
  });

  const submissionMap = new Map(
    submissions.map((s) => [s.problemId, s.status])
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Problems
        </h1>
        <p className="text-slate-500 text-lg">
          Select a problem to begin. Good luck!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contest.problems.map((problem, index) => {
          const status = submissionMap.get(problem.id);
          const isSolved = status === "ACCEPTED";
          const isFailed = status === "REJECTED";

          return (
            <Link key={problem.id} href={`/contest/${contestId}/problems/${problem.id}`}>
              <Card className={cn(
                "h-full hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden border-slate-200",
                isSolved && "border-emerald-200 bg-emerald-50/30"
              )}>
                {isSolved && (
                  <div className="absolute top-0 right-0 p-2">
                    <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                  </div>
                )}

                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-xl transition-colors shrink-0",
                    isSolved ? "bg-emerald-100 text-emerald-700" :
                      isFailed ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                      {problem.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                        {problem.points} Points
                      </Badge>
                      <span>•</span>
                      <span className="uppercase tracking-wider">{problem.type}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      {status ? (
                        <span className={cn(
                          "font-medium",
                          isSolved ? "text-emerald-600" :
                            isFailed ? "text-red-600" : "text-amber-600"
                        )}>
                          {status === "ACCEPTED" ? "Solved" : status === "REJECTED" ? "Wrong Answer" : "Pending"}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not attempted</span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
