import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProblemsClient } from "./ProblemsClient";
import { PreContestPage } from "./PreContestPage";
import { PostContestPage } from "./PostContestPage";
import { AlertCircle, CalendarOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Profile Error
        </h2>
        <p className="text-slate-500 max-w-md">
          We could not find your team profile. Please contact a marshal
          immediately.
        </p>
      </div>
    );
  }

  // 3. Find the active contest
  const contest = await prisma.contest.findFirst({
    where: {
      isActive: true,
      problems: {
        some: { category: teamProfile.category },
      },
    },
    include: {
      problems: {
        where: { category: teamProfile.category },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!contest || contest.problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CalendarOff size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          No Active Contest
        </h2>
        <p className="text-slate-500 max-w-md">
          There is no active contest for your category at the moment.
        </p>
      </div>
    );
  }

  // 4. Check contest state (Pre-start, Active, or Ended)
  const now = new Date();
  const hasStarted = now >= contest.startTime;
  const hasEnded = now > contest.endTime;

  // PRE-CONTEST: Show countdown
  if (!hasStarted) {
    return (
      <PreContestPage
        contestName={contest.name}
        startTime={contest.startTime}
        contestId={contest.id}
      />
    );
  }

  // POST-CONTEST: Show completion message
  if (hasEnded) {
    return (
      <PostContestPage
        contestName={contest.name}
        endTime={contest.endTime}
        contestId={contest.id}
      />
    );
  }

  // ACTIVE CONTEST: Show problems
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
    <ProblemsClient
      problems={contest.problems}
      submissionMap={Object.fromEntries(submissionMap)}
      teamCategory={teamProfile.category}
      contestEndTime={contest.endTime}
    />
  );
}
