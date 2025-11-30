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

    // 1. Authenticate
    // Note: Middleware already enforces auth, so if we're here, user WAS authenticated
    // During revalidation, session might transiently be null - don't redirect in that case
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT") {
        // This shouldn't happen in normal flow (middleware handles it)
        // But during revalidation or edge cases, gracefully show error instead of redirect
        console.warn("Session missing in contest layout - this may indicate a revalidation issue");
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white border border-yellow-200 rounded-lg p-8 text-center shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Issue</h2>
                    <p className="text-slate-600 mb-6">
                        Please refresh the page or{" "}
                        <a href="/login" className="text-blue-600 hover:underline">
                            log in again
                        </a>
                        .
                    </p>
                </div>
            </div>
        );
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
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-8 text-center shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Team Profile Not Found</h2>
                    <p className="text-slate-600 mb-6">
                        Please contact an administrator or{" "}
                        <a href="/login" className="text-blue-600 hover:underline">
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

    // Check if team is blocked/inactive
    if (!teamProfile.is_active) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center px-4 z-50">
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="animate-in zoom-in duration-700">
                        <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mb-6 shadow-lg">
                            <svg
                                className="w-20 h-20 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                            Access Blocked
                        </h1>
                        <p className="text-xl md:text-2xl text-red-600 font-semibold">
                            Your team has been blocked from this contest
                        </p>
                        <p className="text-lg text-slate-600 max-w-xl mx-auto">
                            Please contact the contest administrators for more information.
                        </p>
                    </div>

                    <div className="pt-4">
                        <a
                            href="/login"
                            className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                        >
                            Back to Login
                        </a>
                    </div>
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
                    <h2 className="text-2xl font-bold text-slate-900">Contest Not Found</h2>
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
            teamScore={teamProfile.total_score}
            teamCategory={teamProfile.category}
            contestId={contest.id}
            contestStartTime={contest.startTime}
            contestEndTime={contest.endTime}
            isPaused={contest.isPaused}
            isFrozen={contest.isFrozen} // Pass isFrozen
        >
            {children}
        </ContestLayoutClient>
    );
}
