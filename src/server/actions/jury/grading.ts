"use server";

import { prisma } from "@/lib/prisma";
import { broadcastContestUpdate } from "@/lib/ws-broadcast";
import { SubmissionStatus } from "@prisma/client";

/**
 * Grading Engine - Atomic Accumulator Pattern
 * ICPC Scoring: Most Solved → Lowest Penalty
 * Penalty = Time (minutes) + (20 × Wrong Attempts)
 */

interface GradingResponse {
    success: boolean;
    message: string;
}

interface ProblemStat {
    solved: boolean;
    attempts: number;
    penalty: number;
}

type ProblemStatsMap = Record<string, ProblemStat>;

/**
 * Grade Submission - The Atomic Accumulator
 * 
 * Updates submission status AND TeamScore in a single transaction
 * Implements ICPC scoring logic with O(1) leaderboard reads
 * 
 * @param submissionId - ID of the submission to grade
 * @param status - ACCEPTED or REJECTED
 * @param manualScore - Optional manual score override (for old GradingDialog compatibility)
 * @param juryComment - Optional jury feedback comment
 */
export async function gradeSubmission(
    submissionId: string,
    status: "ACCEPTED" | "REJECTED",
    manualScore?: number,
    juryComment?: string
): Promise<GradingResponse> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // ============================================================
            // STEP 1: Fetch Submission Data
            // ============================================================
            const submission = await tx.submission.findUnique({
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
                throw new Error("Submission not found");
            }

            if (!submission.user.team_profile) {
                throw new Error("Team profile not found");
            }

            const teamId = submission.user.team_profile.id;
            const problemId = submission.problemId;
            const contestStartTime = submission.problem.contest.startTime;

            // ============================================================
            // STEP 2: Get or Create TeamScore
            // ============================================================
            let teamScore = await tx.teamScore.findUnique({
                where: { teamId },
            });

            if (!teamScore) {
                teamScore = await tx.teamScore.create({
                    data: {
                        teamId,
                        solvedCount: 0,
                        totalPenalty: 0,
                        problemStats: {},
                    },
                });
            }

            const problemStats = (teamScore.problemStats as unknown as ProblemStatsMap) || {};
            const currentProblemStat = problemStats[problemId] || {
                solved: false,
                attempts: 0,
                penalty: 0,
            };

            // ============================================================
            // STEP 3: Calculate Submission Time (in minutes)
            // ============================================================
            const submissionTime = submission.submittedAt;
            const elapsedMs = submissionTime.getTime() - contestStartTime.getTime();
            const timeInMinutes = Math.floor(elapsedMs / 60000);

            // ============================================================
            // STEP 4: Update Scores Based on Status
            // ============================================================
            let newSolvedCount = teamScore.solvedCount;
            let newTotalPenalty = teamScore.totalPenalty;

            if (status === "ACCEPTED") {
                // Check if already solved (idempotency)
                if (currentProblemStat.solved) {
                    // Already solved, just update submission status
                    await tx.submission.update({
                        where: { id: submissionId },
                        data: {
                            status: SubmissionStatus.ACCEPTED,
                            manualScore: manualScore,
                            juryComment: juryComment,
                        },
                    });

                    return {
                        teamScore,
                        submission,
                        message: "Problem already solved - no score change",
                    };
                }

                // NEW SOLVE!
                // Calculate penalty: Time + (20 × Previous Rejections)
                const problemPenalty = timeInMinutes + (currentProblemStat.attempts * 20);

                // Update stats
                newSolvedCount += 1;
                newTotalPenalty += problemPenalty;

                // Update problem stats
                problemStats[problemId] = {
                    solved: true,
                    attempts: currentProblemStat.attempts + 1,
                    penalty: problemPenalty,
                };
            } else {
                // REJECTED
                // Just increment attempts, don't add to penalty yet (only counts if solved)
                problemStats[problemId] = {
                    ...currentProblemStat,
                    attempts: currentProblemStat.attempts + 1,
                };
            }

            // ============================================================
            // STEP 5: Atomic Update - Submission + TeamScore
            // ============================================================
            const [updatedSubmission, updatedTeamScore] = await Promise.all([
                tx.submission.update({
                    where: { id: submissionId },
                    data: {
                        status: status === "ACCEPTED" ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
                        manualScore: manualScore,
                        juryComment: juryComment,
                    },
                }),
                tx.teamScore.update({
                    where: { teamId },
                    data: {
                        solvedCount: newSolvedCount,
                        totalPenalty: newTotalPenalty,
                        problemStats: problemStats as any,
                    },
                }),
            ]);

            // ============================================================
            // STEP 6: Create System Log
            // ============================================================
            await tx.systemLog.create({
                data: {
                    action: "MANUAL_GRADE_UPDATE",
                    level: status === "ACCEPTED" ? "INFO" : "WARN",
                    message: `Graded submission: ${status}`,
                    details: `Team: ${submission.user.team_profile.display_name}, Problem: ${submission.problem.title}`,
                    user_id: submission.userId,
                    submission_id: submissionId,
                    metadata: {
                        problemId,
                        status,
                        solvedCount: newSolvedCount,
                        totalPenalty: newTotalPenalty,
                        teamId,
                        manualScore,
                    },
                },
            });

            return {
                submission: updatedSubmission,
                teamScore: updatedTeamScore,
                teamName: submission.user.team_profile.display_name,
                problemTitle: submission.problem.title,
                message: status === "ACCEPTED"
                    ? `Accepted! Solved: ${newSolvedCount}, Penalty: ${newTotalPenalty}`
                    : "Rejected - attempts incremented",
            };
        });

        // ============================================================
        // STEP 7: WebSocket Broadcasts (After Transaction Success)
        // ============================================================
        // Notify admin dashboard (remove from pending)
        await broadcastContestUpdate("ADMIN_UPDATE", {
            action: "SUBMISSION_GRADED",
            submissionId,
            status,
        });

        // Notify leaderboard (update scores)
        await broadcastContestUpdate("LEADERBOARD_UPDATE", {
            teamId: result.teamScore.teamId,
            solvedCount: result.teamScore.solvedCount,
            totalPenalty: result.teamScore.totalPenalty,
        });

        return {
            success: true,
            message: result.message,
        };
    } catch (error) {
        console.error("Error grading submission:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to grade submission",
        };
    }
}

/**
 * Get Submission Preview
 * Reads file content for preview in grading dialog
 */
export async function getSubmissionPreview(submissionId: string): Promise<{
    success: boolean;
    content?: string;
    isBinary?: boolean;
    error?: string;
}> {
    try {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });

        if (!submission) {
            return { success: false, error: "Submission not found" };
        }

        // Read file from disk
        const fs = await import("fs/promises");
        const path = await import("path");

        // Handle both absolute and relative paths
        let filePath = submission.fileUrl;

        // If path starts with /uploads, it's relative to public dir
        if (filePath.startsWith("/uploads")) {
            filePath = path.join(process.cwd(), "public", filePath);
        } else if (!path.isAbsolute(filePath)) {
            filePath = path.join(process.cwd(), "public", filePath);
        }

        try {
            const content = await fs.readFile(filePath, "utf-8");
            return {
                success: true,
                content,
                isBinary: false,
            };
        } catch (error: any) {
            // Check if it's actually a binary file or just not found
            // If the error is ENOENT (File not found), we should return an error, not say it's binary
            if (error.code === 'ENOENT') {
                return {
                    success: false,
                    error: "File not found on server",
                };
            }

            // If UTF-8 fails (encoding error), it's likely binary
            return {
                success: true,
                isBinary: true,
            };
        }
    } catch (error) {
        console.error("Error reading submission file:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to read file",
        };
    }
};
