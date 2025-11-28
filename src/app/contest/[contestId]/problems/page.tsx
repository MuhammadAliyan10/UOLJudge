import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PausedOverlay } from "@/components/contest/PausedOverlay";
import { PreContestPage } from "./PreContestPage";
import { PostContestPage } from "./PostContestPage";
import { AlertCircle, CalendarOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  if (hasEnded) {
    return (
      <PostContestPage
        contestName={contest.name}
        endTime={contest.endTime}
        contestId={contest.id}
      />
    );
  }

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Problems
        </h1>
        <p className="text-slate-500">
          Select a problem to begin. Good luck!
        </p>
      </div>

      <div className="grid gap-4">
        {contest.problems.map((problem, index) => {
          const status = submissionMap.get(problem.id);

          return (
            <Link key={problem.id} href={`/contest/${contestId}/problems/${problem.id}`}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center font-mono font-bold text-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-blue-700 transition-colors">
                        {problem.title}
                      </CardTitle>
                      <CardDescription>
                        {problem.points} Points • {problem.type}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {status && (
                      <Badge variant={status === "ACCEPTED" ? "default" : status === "REJECTED" ? "destructive" : "secondary"}>
                        {status}
                      </Badge>
                    )}
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Optional: Add snippet of description here if needed */}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
