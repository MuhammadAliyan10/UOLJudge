"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole, SubmissionStatus } from "@prisma/client";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface AssignedContest {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    pendingCount: number;
}

interface PendingSubmission {
    id: string;
    fileUrl: string;
    fileType: string;
    submittedAt: Date;
    team: {
        display_name: string;
        lab_location: string | null;
    };
    problem: {
        id: string;
        title: string;
        contestId: string;
    };
    contest: {
        id: string;
        name: string;
    };
}

// ============================================================
// AUTHORIZATION GUARD
// ============================================================

async function requireJury() {
    const session = await getSession();
    if (!session || session.role !== UserRole.JURY) {
        throw new Error("Unauthorized: Jury access required");
    }
    return session;
}

// ============================================================
// JURY DATA FETCHERS
// ============================================================

/**
 * Get Assigned Contests for Current Jury Member
 * 
 * Zero-Trust: Only returns contests explicitly assigned via JuryAssignment
 */
export async function getAssignedContests(): Promise<AssignedContest[]> {
    const session = await requireJury();

    try {
        // Fetch contests where this jury is assigned
        const assignments = await prisma.juryAssignment.findMany({
            where: { userId: session.userId },
            include: {
                contest: {
                    select: {
                        id: true,
                        name: true,
                        startTime: true,
                        endTime: true,
                    },
                },
            },
        });

        // For each contest, count pending submissions
        const contestsWithCounts = await Promise.all(
            assignments.map(async (assignment) => {
                const pendingCount = await prisma.submission.count({
                    where: {
                        status: SubmissionStatus.PENDING,
                        problem: {
                            contestId: assignment.contest.id,
                        },
                    },
                });

                return {
                    ...assignment.contest,
                    pendingCount,
                };
            })
        );

        return contestsWithCounts;
    } catch (error) {
        console.error("Error fetching assigned contests:", error);
        return [];
    }
}

/**
 * Get Pending Submissions for Assigned Contests
 * 
 * Zero-Trust: Only returns submissions from contests the jury is assigned to
 */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
    const session = await requireJury();

    try {
        // First, get assigned contest IDs
        const assignments = await prisma.juryAssignment.findMany({
            where: { userId: session.userId },
            select: { contestId: true },
        });

        const assignedContestIds = assignments.map((a) => a.contestId);

        if (assignedContestIds.length === 0) {
            return [];
        }

        // Fetch pending submissions from assigned contests
        const submissions = await prisma.submission.findMany({
            where: {
                status: SubmissionStatus.PENDING,
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
            },
            orderBy: { submittedAt: "desc" },
            take: 100, // Limit to 100 most recent
        });

        return submissions.map((s) => ({
            id: s.id,
            fileUrl: s.fileUrl,
            fileType: s.fileType,
            submittedAt: s.submittedAt,
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
        console.error("Error fetching pending submissions:", error);
        return [];
    }
}

/**
 * Get Submission Details for Grading
 * 
 * Zero-Trust: Verifies jury is assigned to the submission's contest
 */
export async function getSubmissionForGrading(submissionId: string) {
    const session = await requireJury();

    try {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        team_profile: {
                            select: {
                                display_name: true,
                                category: true,
                                lab_location: true,
                            },
                        },
                    },
                },
                problem: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        points: true,
                        contestId: true,
                        contest: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!submission) {
            throw new Error("Submission not found");
        }

        // ZERO-TRUST CHECK: Verify jury is assigned to this contest
        const isAssigned = await prisma.juryAssignment.findFirst({
            where: {
                userId: session.userId,
                contestId: submission.problem.contestId,
            },
        });

        if (!isAssigned) {
            throw new Error("Access denied: Not assigned to this contest");
        }

        return submission;
    } catch (error) {
        console.error("Error fetching submission for grading:", error);
        throw error;
    }
}

/**
 * Get Grading History for Submission
 * 
 * Returns timeline of all grading actions on this submission
 */
export async function getSubmissionGradingHistory(submissionId: string) {
    const session = await requireJury();

    try {
        const logs = await prisma.systemLog.findMany({
            where: {
                submission_id: submissionId,
                action: "MANUAL_GRADE_UPDATE",
            },
            include: {
                user: {
                    select: {
                        username: true,
                    },
                },
            },
            orderBy: { timestamp: "asc" },
        });

        return logs.map((log) => ({
            timestamp: log.timestamp,
            username: log.user?.username || "System",
            message: log.message,
            details: log.details,
            metadata: log.metadata,
        }));
    } catch (error) {
        console.error("Error fetching grading history:", error);
        return [];
    }
}
