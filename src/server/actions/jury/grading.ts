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
    const result = await prisma.$transaction(
      async (tx) => {
        // ============================================================
        // STEP 1: Fetch Submission Data
        // ============================================================
        const submission = await tx.submission.findUnique({
          where: { id: submissionId },
          include: {
            problem: {
              include: {
                contest: {
                  select: {
                    id: true,
                    name: true,
                    startTime: true,
                    endTime: true,
                    safeZoneMinutes: true,
                    penaltyRate: true,
                    minScorePercent: true,
                  },
                },
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
        const contestId = submission.problem.contest.id;

        // Use upsert to safely get or create TeamScore (prevents race conditions on creation)
        const teamScore = await tx.teamScore.upsert({
          where: {
            teamId_contestId: {
              teamId,
              contestId,
            },
          },
          create: {
            teamId,
            contestId,
            solvedCount: 0,
            totalScore: 0,
            totalPenalty: 0,
            problemStats: {},
          },
          update: {}, // No-op if exists, we update later
        });

        const problemStats =
          (teamScore.problemStats as unknown as ProblemStatsMap) || {};
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
        // STEP 4: Double Grade Check (Race Condition Prevention)
        // ============================================================
        if (submission.status !== SubmissionStatus.PENDING) {
          // If already graded, we must NOT change the score again unless explicitly overriding
          // But for safety, if it's a race, we abort.
          // However, the requirement says "Prevent two juries from overwriting each other".
          // If we are here, we have the lock.

          // If status is already what we want, return success (idempotent)
          if (
            submission.status ===
            (status === "ACCEPTED"
              ? SubmissionStatus.ACCEPTED
              : SubmissionStatus.REJECTED)
          ) {
            return {
              teamScore,
              submission,
              message: "Submission already graded with same status.",
            };
          }

          // If status is different, it means another jury graded it differently just now.
          // We should probably throw or return an error to warn the user.
          throw new Error(
            "Submission was already graded by another jury member."
          );
        }

        // ============================================================
        // STEP 5: Update Scores Based on Status
        // ============================================================
        let newSolvedCount = teamScore.solvedCount;
        let newTotalScore = teamScore.totalScore;
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
          const problemPenalty =
            timeInMinutes + currentProblemStat.attempts * 20;

          // Calculate score to add (use manualScore or problem points)
          const scoreToAdd = manualScore || submission.problem.points;

          // Update stats
          newSolvedCount += 1;
          newTotalScore += scoreToAdd;
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
              status:
                status === "ACCEPTED"
                  ? SubmissionStatus.ACCEPTED
                  : SubmissionStatus.REJECTED,
              manualScore: manualScore,
              juryComment: juryComment,
            },
          }),
          tx.teamScore.update({
            where: {
              teamId_contestId: {
                teamId,
                contestId,
              },
            },
            data: {
              solvedCount: newSolvedCount,
              totalScore: newTotalScore,
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
          message:
            status === "ACCEPTED"
              ? `Accepted! Solved: ${newSolvedCount}, Penalty: ${newTotalPenalty}`
              : "Rejected - attempts incremented",
        };
      },
      {
        isolationLevel: "Serializable", // CRITICAL: Prevent lost updates (race conditions) on concurrent submissions
        maxWait: 5000, // Fail fast if locked
        timeout: 10000,
      }
    );

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
      totalScore: result.teamScore.totalScore,
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
      message:
        error instanceof Error ? error.message : "Failed to grade submission",
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

    // Environment-aware storage directory (Docker volume or local)
    const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/storage";

    let filePath = submission.fileUrl;

    // Handle different path formats
    if (path.isAbsolute(filePath)) {
      // If already absolute (e.g., /app/storage/...), use as-is
      // This handles the Docker volume case
    } else if (filePath.startsWith("/uploads")) {
      // Legacy format: /uploads/... -> join with UPLOAD_DIR
      filePath = path.join(UPLOAD_DIR, filePath.replace("/uploads", ""));
    } else if (filePath.startsWith("uploads")) {
      // Relative format: uploads/... -> join with UPLOAD_DIR
      filePath = path.join(UPLOAD_DIR, filePath);
    } else {
      // Fallback: assume it's relative to UPLOAD_DIR
      filePath = path.join(UPLOAD_DIR, filePath);
    }

    console.log(`[getSubmissionPreview] Attempting to read file: ${filePath}`);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return {
        success: true,
        content,
        isBinary: false,
      };
    } catch (error: any) {
      // Check if it's a file not found error
      if (error.code === "ENOENT") {
        console.error(`[getSubmissionPreview] File not found: ${filePath}`);
        return {
          success: false,
          error: "File not found on server. Path: " + filePath,
        };
      }

      // If UTF-8 fails (encoding error), it's likely binary
      console.log(
        `[getSubmissionPreview] UTF-8 encoding failed, treating as binary: ${filePath}`
      );
      return {
        success: true,
        isBinary: true,
      };
    }
  } catch (error) {
    console.error(
      "[getSubmissionPreview] Error reading submission file:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to read file",
    };
  }
}
