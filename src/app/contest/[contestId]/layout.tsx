import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ContestLayoutClient } from "./ContestLayoutClient";
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

    // 1. Authenticate
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT") {
        redirect("/login");
    }

    // 2. Fetch Team Profile
    const teamProfile = await prisma.teamProfile.findUnique({
        where: { user_id: session.userId },
        select: {
            display_name: true,
            total_score: true,
            category: true,
            assigned_contest_id: true,
            is_active: true,
        },
    });

    if (!teamProfile) {
        redirect("/login");
    }

    // 3. Verify team is assigned to THIS contest
    if (teamProfile.assigned_contest_id !== contestId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-8 text-center shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Unauthorized Access</h2>
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
        },
    });

    if (!contest) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">Contest Not Found</h2>
                </div>
            </div>
        );
    }

    // 5. Check contest state - if ended, redirect to leaderboard
    const now = new Date();
    const hasEnded = now > contest.endTime;

    if (hasEnded) {
        redirect(`/leaderboard/${contest.id}`);
    }

    // 6. Fetch Problems (Filtered by Category) for Sidebar
    const problems = await prisma.problem.findMany({
        where: {
            contestId: contest.id,
            category: teamProfile.category,
        },
        select: {
            id: true,
            title: true,
            orderIndex: true,
        },
        orderBy: { orderIndex: "asc" },
    });

    // 7. Fetch Submission Statuses for Sidebar Indicators
    const submissions = await prisma.submission.findMany({
        where: {
            userId: session.userId,
            problemId: { in: problems.map((p) => p.id) },
        },
        select: {
            problemId: true,
            status: true,
        },
        orderBy: { submittedAt: "desc" },
        distinct: ["problemId"], // Get latest status per problem
    });

    // Create a map of problemId -> status
    const submissionStatusMap: Record<string, SubmissionStatus> = {};
    submissions.forEach((s) => {
        submissionStatusMap[s.problemId] = s.status;
    });

    return (
        <ContestLayoutClient
            teamId={session.userId}
            teamName={teamProfile.display_name}
            teamScore={teamProfile.total_score}
            teamCategory={teamProfile.category}
            contestId={contest.id}
            contestName={contest.name}
            contestStartTime={contest.startTime} // Added
            contestEndTime={contest.endTime}
            isPaused={contest.isPaused}
            pausedAt={contest.pausedAt}
            isBlocked={!teamProfile.is_active}
            problems={problems}
            submissionStatusMap={submissionStatusMap}
        >
            {children}
        </ContestLayoutClient>
    );
}
