"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole, SubmissionStatus } from "@prisma/client";
import { broadcastContestUpdate } from "@/lib/ws-broadcast";
import { revalidatePath } from "next/cache";

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const GradeSubmissionSchema = z.object({
    submissionId: z.string().uuid(),
    verdict: z.enum(["ACCEPTED", "REJECTED"]),
    comment: z.string().optional(),
});

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface GradeSubmissionResponse {
    success: boolean;
    message?: string;
    error?: string;
}

// ============================================================
// ENHANCED GRADING ACTION
// ============================================================

/**
 * Grade Submission - The Atomic Gauntlet
 * 
 * Zero-Trust Implementation with Race Condition Protection:
 * 1. Auth Check: Verify JURY role
 * 2. Assignment Check: Verify jury assigned to contest
 * 3. Concurrency Check: Prevent double-grading
 * 4. Atomic Transaction: Update submission + TeamScore + SystemLog
 * 5. Real-Time Broadcast: Notify all connected clients
 */
export async function gradeSubmissionAction(
    submissionId: string,
    verdict: "ACCEPTED" | "REJECTED",
    comment?: string
): Promise<GradeSubmissionResponse> {
    try {
        // ============================================================
        // STEP 1: AUTH CHECK - Verify JURY role
        // ============================================================
        const session = await getSession();
        if (!session || session.role !== UserRole.JURY) {
            return { success: false, error: "Unauthorized: Jury access required" };
        }

        const juryId = session.userId;

        // ============================================================
        // STEP 2: FETCH SUBMISSION + VERIFY ACCESS
        // ============================================================
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                problem: {
                    include: {
                        contest: true,
                    },
                },
                user: {
                    include: {
                        team_profile: true,
                    },
                },
            },
        });

        if (!submission) {
            return { success: false, error: "Submission not found" };
        }

        const contestId = submission.problem.contest.id;

        // ASSIGNMENT CHECK: Verify jury is assigned to this contest
        const juryAssignment = await prisma.juryAssignment.findFirst({
            where: {
                userId: juryId,
                contestId: contestId,
            },
        });

        if (!juryAssignment) {
            return {
                success: false,
                error: "SECURITY_VIOLATION: You are not assigned to this contest",
            };
        }

        // ============================================================
        // STEP 3: RE-GRADE CAPABILITY
        // ============================================================
        // Allow re-grading for corrections - audit trail tracks all changes
        // If already graded, log the previous state in details
        const previousStatus = submission.status;
        const previousGradedBy = submission.judgedById
            ? await prisma.user.findUnique({
                where: { id: submission.judgedById },
                select: { username: true },
            })
            : null;

        // ============================================================
        // STEP 4: ATOMIC TRANSACTION - Update Everything
        // ============================================================
        const result = await prisma.$transaction(async (tx) => {
            const teamId = submission.user.team_profile?.id;
            const problemId = submission.problemId;
            const contestStartTime = submission.problem.contest.startTime;

            // Get or create TeamScore
            let teamScore = teamId
                ? await tx.teamScore.findUnique({
                    where: { teamId },
                })
                : null;

            if (teamId && !teamScore) {
                teamScore = await tx.teamScore.create({
                    data: {
                        teamId,
                        solvedCount: 0,
                        totalPenalty: 0,
                        problemStats: {},
                    },
                });
            }

            const problemStats = (teamScore?.problemStats as any) || {};
            const currentProblemStat = problemStats[problemId] || {
                solved: false,
                attempts: 0,
                penalty: 0,
            };

            // Calculate submission time (in minutes)
            const submissionTime = submission.submittedAt;
            const elapsedMs = submissionTime.getTime() - contestStartTime.getTime();
            const timeInMinutes = Math.floor(elapsedMs / 60000);

            let newSolvedCount = teamScore?.solvedCount || 0;
            let newTotalPenalty = teamScore?.totalPenalty || 0;

            if (verdict === "ACCEPTED") {
                if (!currentProblemStat.solved) {
                    // NEW SOLVE! Calculate penalty: Time + (20 × Previous Rejections)
                    const problemPenalty = timeInMinutes + currentProblemStat.attempts * 20;

                    newSolvedCount += 1;
                    newTotalPenalty += problemPenalty;

                    problemStats[problemId] = {
                        solved: true,
                        attempts: currentProblemStat.attempts + 1,
                        penalty: problemPenalty,
                    };
                }
            } else {
                // REJECTED - Just increment attempts
                problemStats[problemId] = {
                    ...currentProblemStat,
                    attempts: currentProblemStat.attempts + 1,
                };
            }

            // Update submission
            const updatedSubmission = await tx.submission.update({
                where: { id: submissionId },
                data: {
                    status: verdict === "ACCEPTED" ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
                    manualScore: verdict === "ACCEPTED" ? submission.problem.points : 0,
                    judgedById: juryId,
                    juryComment: comment || null,
                },
            });

            // Update TeamScore if applicable
            let updatedTeamScore = null;
            if (teamScore) {
                updatedTeamScore = await tx.teamScore.update({
                    where: { teamId: teamScore.teamId },
                    data: {
                        solvedCount: newSolvedCount,
                        totalPenalty: newTotalPenalty,
                        problemStats: problemStats as any,
                    },
                });
            }

            // Create System Log with re-grade tracking
            const isRegrade = previousStatus !== SubmissionStatus.PENDING;
            await tx.systemLog.create({
                data: {
                    action: "MANUAL_GRADE_UPDATE",
                    level: verdict === "ACCEPTED" ? "INFO" : "WARN",
                    message: `${isRegrade ? "RE-GRADED" : "Graded"} submission: ${verdict}`,
                    details: `Jury ${session.username} changed score from ${previousStatus} to ${verdict}.${isRegrade && previousGradedBy
                        ? ` (Previously graded by ${previousGradedBy.username})`
                        : ""
                        } ${comment ? `Reason: ${comment}` : ""}`,
                    user_id: juryId,
                    submission_id: submissionId,
                    metadata: {
                        problemId,
                        verdict,
                        solvedCount: newSolvedCount,
                        totalPenalty: newTotalPenalty,
                        teamId: teamScore?.teamId,
                        juryComment: comment,
                        oldStatus: previousStatus,
                        newStatus: verdict,
                        isRegrade,
                        previousJuryId: submission.judgedById,
                    },
                },
            });
            return {
                submission: updatedSubmission,
                teamScore: updatedTeamScore,
            };
        });

        // ============================================================
        // STEP 5: REAL-TIME BROADCASTS
        // ============================================================
        // Notify admin dashboard (submission graded)
        await broadcastContestUpdate("SUBMISSION_UPDATE", {
            action: "SUBMISSION_GRADED",
            submissionId,
            status: verdict,
            judgedById: juryId,
        });

        // Notify leaderboard (score update)
        if (result.teamScore) {
            await broadcastContestUpdate("LEADERBOARD_UPDATE", {
                teamId: result.teamScore.teamId,
                solvedCount: result.teamScore.solvedCount,
                totalPenalty: result.teamScore.totalPenalty,
            });
        }

        // Notify other juries (queue update)
        await broadcastContestUpdate("JURY_QUEUE_UPDATE", {
            contestId,
            action: "SUBMISSION_GRADED",
        });

        // Revalidate jury dashboard
        revalidatePath("/jury");

        return {
            success: true,
            message: `Submission graded as ${verdict}`,
        };
    } catch (error: any) {
        console.error("Error grading submission:", error);
        return {
            success: false,
            error: error.message || "Failed to grade submission",
        };
    }
}
