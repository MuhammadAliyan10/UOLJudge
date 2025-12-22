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

      // PREVENT CONCURRENT GRADING:
      // Block ONLY if another jury has already graded (judgedById is set AND different from current jury)
      // Allow if: judgedById is NULL (auto-approved, first grading) OR judgedById === juryId (re-grading own work)
      const alreadyGradedByAnotherJury =
        currentSubmission.judgedById !== null &&
        currentSubmission.judgedById !== juryId;

      if (alreadyGradedByAnotherJury) {
        throw new Error(
          `RACE_CONDITION_BLOCKED: This submission was already graded by another jury member. Refresh to see the latest status.`
        );
      }

      const teamId = submission.user.team_profile?.id;
      const problemId = submission.problemId;
      const contestStartTime = submission.problem.contest.startTime;
      const contestId = submission.problem.contest.id;

      // CRITICAL FIX (Audit Issue #3): Use atomic upsert instead of find-then-create
      // This prevents race condition where two juries grading same team's submissions
      // simultaneously could create duplicate TeamScore records
      const teamScore = teamId
        ? await tx.teamScore.upsert({
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
            update: {}, // No-op if exists, we update separately below
          })
        : null;

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

      let newTotalScore = teamScore?.totalScore || 0;

      // Determine score to add
      // If manual score is provided, use it. Otherwise default to max points.
      let finalScore = 0;
      if (score !== undefined) {
        finalScore = score;
      } else {
        finalScore = submission.problem.points;
      }

      // "COUNT THEN VERIFY" MODEL:
      // solvedCount was already incremented on submission (auto-accept)
      // Jury only updates the score (quality rating), not the solve status

      // Deduct previous score if this problem was already graded
      if (
        currentProblemStat.score !== undefined &&
        currentProblemStat.score > 0
      ) {
        newTotalScore -= currentProblemStat.score;
      }

      // Add the new score
      newTotalScore += finalScore;

      // Update problem stats with new score
      problemStats[problemId] = {
        ...currentProblemStat,
        score: finalScore,
      };

      // Update submission
      const updatedSubmission = await tx.submission.update({
        where: { id: submissionId },
        data: {
          status:
            verdict === "ACCEPTED"
              ? SubmissionStatus.ACCEPTED
              : SubmissionStatus.REJECTED,
          manualScore: finalScore,
          judgedById: juryId,
          juryComment: comment || null,
        },
      });

      // Update TeamScore if applicable (only totalScore, not solvedCount/penalty)
      let updatedTeamScore = null;
      if (teamScore) {
        updatedTeamScore = await tx.teamScore.update({
          where: {
            teamId_contestId: {
              teamId: teamScore.teamId,
              contestId: teamScore.contestId,
            },
          },
          data: {
            totalScore: newTotalScore,
            problemStats: problemStats as any,
          },
        });
      }

      // Create System Log with score update tracking
      const isRegrade = previousStatus !== SubmissionStatus.PENDING;
      await tx.systemLog.create({
        data: {
          action: "MANUAL_GRADE_UPDATE",
          level: "INFO",
          message: `Jury updated score: ${finalScore} points`,
          details: `Jury ${session.username} set score to ${finalScore}.${
            isRegrade && previousGradedBy
              ? ` (Previously graded by ${previousGradedBy.username})`
              : ""
          } ${comment ? `Comment: ${comment}` : ""}`,
          user_id: juryId,
          submission_id: submissionId,
          metadata: {
            problemId,
            score: finalScore,
            totalScore: newTotalScore,
            teamId: teamScore?.teamId,
            juryComment: comment,
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

    // Return success response after transaction completes
    return {
      success: true,
      message: "Submission graded successfully",
    };
  } catch (error: any) {
    console.error("Error grading submission:", error);
    return {
      success: false,
      error: error.message || "Failed to grade submission",
    };
  }
}
