import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ContestLayoutClient } from "../ContestLayoutClient"; // Import from parent directory
import { SubmissionStatus } from "@prisma/client";

interface ContestIdLayoutProps {
  params: Promise<{ contestId: string }>;
  children: React.ReactNode;
}

export default async function ContestIdLayout({
  params,
  children,
}: ContestIdLayoutProps) {
  // Await params in Next.js 15
  const { contestId } = await params;

  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    // During WebSocket revalidation, continue with minimal render
    // Middleware will handle actual auth, this is just transient
    return null; // This will be brief, Next.js will re-render with session
  }

  // 2. Fetch Team Profile with REAL-TIME score from TeamScore
  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
    select: {
      display_name: true,
      category: true,
      assigned_contest_id: true,
      is_active: true,
      is_blocked: true,
      // Fetch real-time score from TeamScore table (NOT cached total_score)
      team_score: {
        select: {
          totalScore: true,
          solvedCount: true,
        },
      },
    },
  });

  if (!teamProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Team Profile Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            Please contact an administrator or{" "}
            <a href="/login" className="text-primary hover:underline">
              log in again
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  // 3. Verify team is assigned to THIS contest
  if (teamProfile.assigned_contest_id !== contestId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Unauthorized Access
          </h2>
          <p className="text-slate-600 mb-6">
            You are assigned to a different contest.
          </p>
          {teamProfile.assigned_contest_id && (
            <a
              href={`/contest/${teamProfile.assigned_contest_id}/problems`}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Your Contest
            </a>
          )}
        </div>
      </div>
    );
  }

  // Check if team is blocked/inactive
  if (!teamProfile.is_active) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center px-4 z-50">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Account Suspended
              </h1>
              <p className="text-slate-500 text-sm">
                Your account has been temporarily suspended from this contest.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Info Box */}
            <div className="bg-slate-50 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                What to do
              </p>
              <p className="text-sm text-slate-600">
                Please contact the contest administrators or visit the jury desk
                for assistance.
              </p>
            </div>

            {/* Button */}
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              Return to Login
            </a>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            UOLJudge • Programming Contest Platform
          </p>
        </div>
      </div>
    );
  }

  // 4. Fetch the contest with pause state
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      isActive: true,
      isPaused: true,
      pausedAt: true,
      isFrozen: true, // Fetch isFrozen
    },
  });

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Contest Not Found
          </h2>
        </div>
      </div>
    );
  }

  // 5. Check contest state - if ended, redirect to leaderboard
  const now = new Date();
  const hasEnded = now > contest.endTime;

  // if (hasEnded) {
  //     redirect(`/leaderboard/${contest.id}`);
  // }

  return (
    <ContestLayoutClient
      teamName={teamProfile.display_name}
      teamId={session.userId}
      initialScore={teamProfile.team_score?.totalScore || 0}
      teamCategory={teamProfile.category}
      contestId={contest.id}
      contestName={contest.name}
      contestStartTime={contest.startTime}
      contestEndTime={contest.endTime}
      isPaused={contest.isPaused}
      isFrozen={contest.isFrozen}
      isBlocked={teamProfile.is_blocked}
    >
      {children}
    </ContestLayoutClient>
  );
}
