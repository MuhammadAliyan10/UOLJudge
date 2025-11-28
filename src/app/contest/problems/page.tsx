import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProblemsClient } from "./ProblemsClient";
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

  // 3. Fetch Active Contest
  const contest = await prisma.contest.findFirst({
    where: {
      is_active: true,
      start_time: { lte: new Date() },
      end_time: { gte: new Date() },
    },
    include: {
      problems: {
        where: { category: teamProfile.category }, // SECURITY: Category Filter
        orderBy: { order_index: "asc" },
      },
    },
  });

  if (!contest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CalendarOff size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          No Active Contest
        </h2>
        <p className="text-slate-500 max-w-md">
          There are no competitions running right now. Please wait for the start
          time.
        </p>
      </div>
    );
  }

  // 4. Fetch Submission Statuses
  const submissions = await prisma.submission.findMany({
    where: {
      user_id: session.userId,
      problem_id: { in: contest.problems.map((p) => p.id) },
    },
    orderBy: { submitted_at: "desc" },
    distinct: ["problem_id"],
  });

  const submissionMap = new Map(
    submissions.map((s) => [s.problem_id, s.verdict])
  );

  return (
    <ProblemsClient
      problems={contest.problems}
      submissionMap={Object.fromEntries(submissionMap)}
      teamCategory={teamProfile.category}
      contestEndTime={contest.end_time}
    />
  );
}
