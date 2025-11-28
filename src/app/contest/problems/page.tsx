import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProblemsClient } from "./ProblemsClient";
import { AlertCircle, CalendarOff } from "lucide-react";

export const dynamic = "force-dynamic";
// src/app/contest/problems/page.tsx

export default async function ProblemsPage() {
  // 1. Auth Check (Keep as is)
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // 2. Fetch Team Profile
  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
  });

  if (!teamProfile) {
    // ... return Profile Error Screen ...
    // (Omitted for brevity, but keep the full error JSX from your code)
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

  // 3. Find the CONTEST ID using the canonical route context (since we are on a dynamic route)
  // This page is nested under /[contestId]/, but the current code doesn't receive 'params' here
  // (because it's a sub-page, it should receive params from the outer layout).
  // --- Assuming the route is the dynamic one: src/app/contest/[contestId]/problems/page.tsx ---

  // NOTE: Assuming your page is currently NOT receiving `params` because the current code structure is flawed for a sub-page.
  // The outer layout should pass the contest ID context. Since it doesn't, we need to find it again, but EASIER.

  // --- FIX LOGIC: Find the active contest without time checks ---
  const contest = await prisma.contest.findFirst({
    where: {
      is_active: true, // Only filter by active status
      problems: {
        some: { category: teamProfile.category }, // Filter by Category
      },
    },
    include: {
      problems: {
        where: { category: teamProfile.category },
        orderBy: { order_index: "asc" },
      },
    },
  });

  // If the contest is found but has problems, we load it.
  // The client side timer will handle the visual countdown to zero.
  if (!contest || contest.problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CalendarOff size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          No Active Problems
        </h2>
        <p className="text-slate-500 max-w-md">
          The contest is either inactive or has no problems available for your
          category.
        </p>
      </div>
    );
  }

  // --- 4. Proceed with rendering (trusting the layout redirector for initial time lock) ---
  const submissions = await prisma.submission.findMany({
    // ... (rest of submission logic remains the same) ...
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
