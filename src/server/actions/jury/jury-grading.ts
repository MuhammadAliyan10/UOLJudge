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
    comment?: string,
    score?: number // NEW: Optional manual score
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
            // ============================================================
            // RACE CONDITION PREVENTION (SECURITY AUDIT V4.0)
            // ============================================================
            // Re-fetch submission inside transaction to check current status
            const currentSubmission = await tx.submission.findUnique({
                where: { id: submissionId },
                select: { status: true, judgedById: true },
            });

            if (!currentSubmission) {
                throw new Error("Submission not found");
            }

            // PREVENT CONCURRENT GRADING: If already graded by another jury, block this operation
            if (
                currentSubmission.status !== SubmissionStatus.PENDING &&
                currentSubmission.judgedById !== juryId
            ) {
                throw new Error(
                    `RACE_CONDITION_BLOCKED: This submission was already graded by another jury member. Refresh to see the latest status.`
                );
            }

            const teamId = submission.user.team_profile?.id;
            const problemId = submission.problemId;
            const contestStartTime = submission.problem.contest.startTime;

            // Get or create TeamScore
            let teamScore = teamId
                ? await tx.teamScore.findFirst({
                    where: {
                        teamId,
                        contestId: submission.problem.contest.id
                    },
                })
                : null;

            if (teamId && !teamScore) {
                teamScore = await tx.teamScore.create({
                    data: {
                        teamId,
                        contestId: submission.problem.contest.id,
                        solvedCount: 0,
                        totalScore: 0,
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
                score: 0, // Track score per problem
            };

            // Calculate submission time (in minutes)
            const submissionTime = submission.submittedAt;
            const elapsedMs = submissionTime.getTime() - contestStartTime.getTime();
            const timeInMinutes = Math.floor(elapsedMs / 60000);

            let newSolvedCount = teamScore?.solvedCount || 0;
            let newTotalScore = teamScore?.totalScore || 0;
            let newTotalPenalty = teamScore?.totalPenalty || 0;

            // Determine score to add
            // If manual score is provided, use it. Otherwise default to max points for ACCEPTED, 0 for REJECTED.
            let finalScore = 0;
            if (score !== undefined) {
                finalScore = score;
            } else {
                finalScore = verdict === "ACCEPTED" ? submission.problem.points : 0;
            }

            // RE-GRADING LOGIC: Deduct previous score if this problem was already solved/graded
            if (currentProblemStat.solved && currentProblemStat.score !== undefined) {
                newTotalScore -= currentProblemStat.score;
                // If previously solved, we don't decrement solvedCount usually, unless status changes to REJECTED?
                // ICPC rules: once solved, always solved. But for manual grading, we might revoke.
                // If changing from ACCEPTED to REJECTED, decrement solved count.
                if (previousStatus === "ACCEPTED" && verdict === "REJECTED") {
                    newSolvedCount = Math.max(0, newSolvedCount - 1);
                }
            } else if (previousStatus === "ACCEPTED" && verdict === "REJECTED") {
                // Should not happen if currentProblemStat.solved is false, but safety check
                newSolvedCount = Math.max(0, newSolvedCount - 1);
            }


            if (verdict === "ACCEPTED") {
                if (!currentProblemStat.solved || previousStatus !== "ACCEPTED") {
                    // NEW SOLVE! Calculate penalty: Time + (20 × Previous Rejections)
                    const problemPenalty = timeInMinutes + currentProblemStat.attempts * 20;

                    newSolvedCount += 1;
                    newTotalScore += finalScore;
                    newTotalPenalty += problemPenalty;

                    problemStats[problemId] = {
                        solved: true,
                        attempts: currentProblemStat.attempts + 1,
                        penalty: problemPenalty,
                        score: finalScore,
                    };
                } else {
                    // Already solved, just updating score (Re-grade with different score)
                    newTotalScore += finalScore;
                    problemStats[problemId] = {
                        ...currentProblemStat,
                        score: finalScore,
                    };
                }
            } else {
                // REJECTED
                problemStats[problemId] = {
                    ...currentProblemStat,
                    solved: false, // Mark as unsolved if rejected
                    attempts: currentProblemStat.attempts + 1,
                    score: 0,
                };
            }

            // Update submission
            const updatedSubmission = await tx.submission.update({
                where: { id: submissionId },
                data: {
                    status: verdict === "ACCEPTED" ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
                    manualScore: finalScore,
                    judgedById: juryId,
                    juryComment: comment || null,
                },
            });

            // Update TeamScore if applicable
            let updatedTeamScore = null;
            if (teamScore) {
                updatedTeamScore = await tx.teamScore.update({
                    where: {
                        teamId_contestId: {
                            teamId: teamScore.teamId,
                            contestId: teamScore.contestId
                        }
                    },
                    data: {
                        solvedCount: newSolvedCount,
                        totalScore: newTotalScore,
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
                    message: `${isRegrade ? "RE-GRADED" : "Graded"} submission: ${verdict} (Score: ${finalScore})`,
                    details: `Jury ${session.username} changed score from ${previousStatus} to ${verdict}.${isRegrade && previousGradedBy
                        ? ` (Previously graded by ${previousGradedBy.username})`
                        : ""
                        } ${comment ? `Reason: ${comment}` : ""}`,
                    user_id: juryId,
                    submission_id: submissionId,
                    metadata: {
                        problemId,
                        verdict,
                        score: finalScore,
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
            score: score,
        });

        // Notify leaderboard (score update)
        if (result.teamScore) {
            await broadcastContestUpdate("LEADERBOARD_UPDATE", {
                teamId: result.teamScore.teamId,
                solvedCount: result.teamScore.solvedCount,
                totalScore: result.teamScore.totalScore,
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
            message: `Submission graded as ${verdict} with ${score ?? (verdict === "ACCEPTED" ? submission.problem.points : 0)} points`,
        };
    } catch (error: any) {
        console.error("Error grading submission:", error);
        return {
            success: false,
            error: error.message || "Failed to grade submission",
        };
    }
}

