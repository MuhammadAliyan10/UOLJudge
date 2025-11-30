"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole, SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { broadcastContestUpdate } from "@/lib/ws-broadcast";

// ============================================================
// RETRY REQUEST SYSTEM - The "Second Chance" Protocol
// ============================================================

/**
 * Request Retry - Team begs for another chance
 * 
 * Auth: Team Owner only (Participant who made the submission)
 * Logic: Update Submission (retryRequested: true, retryReason: reason)
 * Broadcast: Send RETRY_REQUESTED to Pulse Engine
 */
export async function requestRetry(submissionId: string, reason: string) {
    try {
        // 1. AUTH CHECK
        const session = await getSession();
        if (!session || session.role !== UserRole.PARTICIPANT) {
            return {
                success: false,
                error: "Unauthorized: Only team members can request retry",
            };
        }

        // 2. FIND SUBMISSION
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: {
                    select: {
                        team_profile: {
                            select: {
                                display_name: true,
                            },
                        },
                    },
                },
                problem: {
                    select: {
                        id: true,
                        title: true,
                        contestId: true,
                    },
                },
            },
        });

        if (!submission) {
            return {
                success: false,
                error: "Submission not found",
            };
        }

        // 3. OWNERSHIP CHECK
        if (submission.userId !== session.userId) {
            return {
                success: false,
                error: "Access denied: This is not your submission",
            };
        }

        // 4. VALIDATION: Must be REJECTED to request retry
        if (submission.status !== SubmissionStatus.REJECTED) {
            return {
                success: false,
                error: "Can only request retry for rejected submissions",
            };
        }

        // 5. VALIDATION: Cannot request if already requested
        if (submission.retryRequested) {
            return {
                success: false,
                error: "Retry already requested for this submission",
            };
        }

        // 6. VALIDATION: Cannot request if retry already granted
        if (submission.canRetry) {
            return {
                success: false,
                error: "Retry already granted - you can submit again",
            };
        }

        // 7. VALIDATION: Reason must be provided
        if (!reason || reason.trim().length < 10) {
            return {
                success: false,
                error: "Please provide a detailed reason (minimum 10 characters)",
            };
        }

        // 8. UPDATE SUBMISSION
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                retryRequested: true,
                retryReason: reason.trim(),
                retryRequestedAt: new Date(),
            },
        });

        // 9. BROADCAST TO WEBSOCKET (Pulse Engine)
        const teamName = submission.user.team_profile?.display_name || "Unknown Team";

        await broadcastContestUpdate("RETRY_REQUESTED", {
            submissionId,
            teamName,
            reason: reason.trim(),
            problemTitle: submission.problem.title,
            contestId: submission.problem.contestId,
        });

        // 10. REVALIDATE PATHS
        revalidatePath(`/contest/${submission.problem.contestId}/submissions`);
        revalidatePath("/jury");
        revalidatePath("/jury/submissions");

        return {
            success: true,
            message: "Retry request submitted successfully",
        };
    } catch (error) {
        console.error("Error requesting retry:", error);
        return {
            success: false,
            error: "Failed to submit retry request",
        };
    }
}

/**
 * Grant Retry - Jury grants mercy
 * 
 * Auth: Assigned Jury only
 * Logic: Update Submission (canRetry: true, retryRequested: false, status: REJECTED)
 * Broadcast: Send SUBMISSION_UPDATE (Team sees "Retry Granted")
 */
export async function grantRetry(submissionId: string) {
    try {
        // 1. AUTH CHECK
        const session = await getSession();
        if (!session || session.role !== UserRole.JURY) {
            return {
                success: false,
                error: "Unauthorized: Only jury members can grant retry",
            };
        }

        // 2. FIND SUBMISSION
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                problem: {
                    select: {
                        contestId: true,
                        title: true,
                    },
                },
                user: {
                    select: {
                        team_profile: {
                            select: {
                                display_name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!submission) {
            return {
                success: false,
                error: "Submission not found",
            };
        }

        // 3. ZERO-TRUST CHECK: Verify jury is assigned to this contest
        const isAssigned = await prisma.juryAssignment.findFirst({
            where: {
                userId: session.userId,
                contestId: submission.problem.contestId,
            },
        });

        if (!isAssigned) {
            return {
                success: false,
                error: "Access denied: Not assigned to this contest",
            };
        }

        // 4. VALIDATION: Retry must be requested
        if (!submission.retryRequested) {
            return {
                success: false,
                error: "No retry request found for this submission",
            };
        }

        // 5. VALIDATION: Cannot grant if already granted
        if (submission.canRetry) {
            return {
                success: false,
                error: "Retry already granted",
            };
        }

        // 6. UPDATE SUBMISSION - Grant Mercy
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                canRetry: true,
                retryRequested: false,
                retryGrantedBy: session.username,
                // Keep status as REJECTED so team knows they need to resubmit
            },
        });

        // 7. CREATE SYSTEM LOG
        await prisma.systemLog.create({
            data: {
                action: "MANUAL_GRADE_UPDATE",
                level: "INFO",
                message: `Retry granted by ${session.username}`,
                details: `Jury ${session.username} granted retry request for submission ${submissionId}`,
                metadata: {
                    submissionId,
                    action: "RETRY_GRANTED",
                    juryUsername: session.username,
                    teamName: submission.user.team_profile?.display_name,
                    problemTitle: submission.problem.title,
                },
                user_id: session.userId,
                submission_id: submissionId,
            },
        });

        // 8. BROADCAST TO WEBSOCKET
        await broadcastContestUpdate("RETRY_GRANTED", {
            submissionId,
            contestId: submission.problem.contestId,
            grantedBy: session.username,
            teamName: submission.user.team_profile?.display_name,
        });

        // 9. REVALIDATE PATHS
        revalidatePath(`/contest/${submission.problem.contestId}/submissions`);
        revalidatePath("/jury");
        revalidatePath("/jury/submissions");
        revalidatePath(`/jury/grade/${submissionId}`);

        return {
            success: true,
            message: "Retry granted successfully",
        };
    } catch (error) {
        console.error("Error granting retry:", error);
        return {
            success: false,
            error: "Failed to grant retry",
        };
    }
}

/**
 * Get Retry Requests - Fetch pending retry requests
 * 
 * Auth: Jury only
 * Returns: Submissions with retryRequested = true for assigned contests
 */
export async function getRetryRequests() {
    try {
        const session = await getSession();
        if (!session || session.role !== UserRole.JURY) {
            // During revalidation, session might be transiently null - return empty instead of throwing
            return [];
        }

        // Get assigned contest IDs
        const assignments = await prisma.juryAssignment.findMany({
            where: { userId: session.userId },
            select: { contestId: true },
        });

        const assignedContestIds = assignments.map((a) => a.contestId);

        if (assignedContestIds.length === 0) {
            return [];
        }

        // Fetch retry requests from assigned contests
        const retryRequests = await prisma.submission.findMany({
            where: {
                retryRequested: true,
                canRetry: false, // Not yet granted
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
                    },
                },
            },
            orderBy: { retryRequestedAt: "desc" },
        });

        return retryRequests.map((r) => ({
            id: r.id,
            reason: r.retryReason || "No reason provided",
            requestedAt: r.retryRequestedAt,
            team: {
                display_name: r.user.team_profile?.display_name || "Unknown Team",
                lab_location: r.user.team_profile?.lab_location || null,
            },
            problem: {
                id: r.problem.id,
                title: r.problem.title,
                contestId: r.problem.contestId,
            },
        }));
    } catch (error) {
        console.error("Error fetching retry requests:", error);
        return [];
    }
}
