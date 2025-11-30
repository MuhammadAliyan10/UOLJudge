"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// ============================================================
// JURY DASHBOARD STATISTICS
// ============================================================

async function requireJury() {
    const session = await getSession();
    if (!session || session.role !== UserRole.JURY) {
        throw new Error("Unauthorized: Jury access required");
    }
    return session;
}

/**
 * Get Jury Dashboard Stats
 * 
 * Returns: Total teams, pending submissions, retry requests, graded today
 */
export async function getJuryDashboardStats() {
    try {
        const session = await requireJury();

        // Get assigned contest IDs
        const assignments = await prisma.juryAssignment.findMany({
            where: { userId: session.userId },
            select: { contestId: true },
        });

        const assignedContestIds = assignments.map((a) => a.contestId);

        if (assignedContestIds.length === 0) {
            return {
                totalTeams: 0,
                pendingSubmissions: 0,
                retryRequests: 0,
                gradedToday: 0,
            };
        }

        // Get stats
        const [totalTeams, pendingSubmissions, retryRequests, gradedToday] = await Promise.all([
            // Total teams in assigned contests
            prisma.teamProfile.count({
                where: {
                    assigned_contest_id: { in: assignedContestIds },
                },
            }),
            // Pending submissions
            prisma.submission.count({
                where: {
                    status: "PENDING",
                    problem: {
                        contestId: { in: assignedContestIds },
                    },
                },
            }),
            // Retry requests
            prisma.submission.count({
                where: {
                    retryRequested: true,
                    canRetry: false,
                    problem: {
                        contestId: { in: assignedContestIds },
                    },
                },
            }),
            // Graded today
            prisma.systemLog.count({
                where: {
                    action: "MANUAL_GRADE_UPDATE",
                    user_id: session.userId,
                    timestamp: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        return {
            totalTeams,
            pendingSubmissions,
            retryRequests,
            gradedToday,
        };
    } catch (error) {
        console.error("Error fetching jury dashboard stats:", error);
        return {
            totalTeams: 0,
            pendingSubmissions: 0,
            retryRequests: 0,
            gradedToday: 0,
        };
    }
}

/**
 * Get Recent Activity Logs
 * 
 * Returns: Recent system logs for assigned contests
 */
export async function getRecentLogs(limit = 10) {
    try {
        const session = await requireJury();

        // Get assigned contest IDs
        const assignments = await prisma.juryAssignment.findMany({
            where: { userId: session.userId },
            select: { contestId: true },
        });

        const assignedContestIds = assignments.map((a) => a.contestId);

        if (assignedContestIds.length === 0) {
            return [];
        }

        // Get recent logs related to submissions in assigned contests
        const logs = await prisma.systemLog.findMany({
            where: {
                OR: [
                    // Logs for manual grade updates
                    {
                        action: "MANUAL_GRADE_UPDATE",
                        submission_id: {
                            not: null,
                        },
                    },
                    // Logs for submissions
                    {
                        action: "SUBMISSION",
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        username: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                timestamp: "desc",
            },
            take: limit,
        });

        return logs.map((log) => ({
            id: log.id,
            action: log.action,
            message: log.message,
            details: log.details,
            timestamp: log.timestamp,
            username: log.user?.username || "System",
            role: log.user?.role || null,
            level: log.level,
        }));
    } catch (error) {
        console.error("Error fetching recent logs:", error);
        return [];
    }
}

/**
 * Get All Graded Submissions (for History page)
 * 
 * Returns: All graded submissions (ACCEPTED/REJECTED) for assigned contests
 */
export async function getAllGradedSubmissions() {
    try {
        const session = await requireJury();

        // Get assigned contest IDs
        const assignments = await prisma.juryAssignment.findMany({
            where: { userId: session.userId },
            select: { contestId: true },
        });

        const assignedContestIds = assignments.map((a) => a.contestId);

        if (assignedContestIds.length === 0) {
            return [];
        }

        // Fetch graded submissions
        const submissions = await prisma.submission.findMany({
            where: {
                status: {
                    in: ["ACCEPTED", "REJECTED"],
                },
                problem: {
                    contestId: { in: assignedContestIds },
                },
            },
            include: {
                user: {
                    select: {
                        team_profile: {
                            select: {
                                display_name: true,
                                lab_location: true,
                            },
                        },
                    },
                },
                problem: {
                    select: {
                        id: true,
                        title: true,
                        contestId: true,
                        contest: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                judgedBy: {
                    select: {
                        username: true,
                    },
                },
            },
            orderBy: { submittedAt: "desc" },
            take: 200,
        });

        return submissions.map((s) => ({
            id: s.id,
            status: s.status,
            finalScore: s.finalScore,
            submittedAt: s.submittedAt,
            juryComment: s.juryComment,
            judgedBy: s.judgedBy?.username || null,
            team: {
                display_name: s.user.team_profile?.display_name || "Unknown Team",
                lab_location: s.user.team_profile?.lab_location || null,
            },
            problem: {
                id: s.problem.id,
                title: s.problem.title,
                contestId: s.problem.contestId,
            },
            contest: {
                id: s.problem.contest.id,
                name: s.problem.contest.name,
            },
        }));
    } catch (error) {
        console.error("Error fetching graded submissions:", error);
        return [];
    }
}
