"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateContestAccess } from "@/lib/utils/contestGate";
import { saveFile, getFileExtension, validateFileType } from "@/lib/storage";
import { broadcastContestUpdate } from "@/lib/ws-broadcast";
import { SubmissionStatus } from "@prisma/client";

/**
 * Submission Server Action - "The Gauntlet"
 * Zero-Trust Validation with Atomic Transactions
 */

interface SubmitResponse {
  success: boolean;
  message: string;
  submissionId?: string;
}

/**
 * Submit Solution - The Core Logic
 *
 * Validation Flow (The Gauntlet):
 * 1. Auth Check (Server Session - SECURITY FIX)
 * 2. $Z$-Gate (Contest Access)
 * 3. Category Isolation Check
 * 4. ρ-Constraint (One Active Submission)
 * 5. File Type Validation
 * 6. Save File & Create Submission (Atomic)
 * 7. WebSocket Broadcast
 */
export async function submitSolution(
  formData: FormData
): Promise<SubmitResponse> {
  try {
    // ============================================================
    // SECURITY FIX (Audit SEC1): Get userId from SERVER SESSION
    // NEVER trust client-provided userId - prevents cross-team attacks
    // ============================================================
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT") {
      return {
        success: false,
        message: "Unauthorized: Must be logged in as participant",
      };
    }
    const userId = session.userId; // Secure: from server session, not client

    // Extract form data (only file and IDs from client)
    const file = formData.get("file") as File | null;
    const problemId = formData.get("problemId") as string;
    const contestId = formData.get("contestId") as string;
    // NOTE: userId removed from formData - security vulnerability fixed

    // Basic validation
    if (!file) {
      return { success: false, message: "No file provided" };
    }

    if (!problemId || !contestId) {
      return { success: false, message: "Missing required fields" };
    }

    if (file.size === 0) {
      return { success: false, message: "File is empty" };
    }

    // ============================================================
    // STEP 1: $Z$-GATE - Contest Access Validation
    // ============================================================
    const accessCheck = await validateContestAccess(contestId);

    if (!accessCheck.valid) {
      return {
        success: false,
        message: accessCheck.reason || "Contest access denied",
      };
    }

    // ============================================================
    // PERFORMANCE FIX (Audit S1): Parallelize ALL DB queries
    // Combined: user+team_profile, problem, contest into ONE Promise.all
    // Eliminates duplicate user fetch (was: tempUser then user)
    // ============================================================
    const [user, problem, contest] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { team_profile: true },
      }),
      prisma.problem.findUnique({
        where: { id: problemId },
      }),
      prisma.contest.findUnique({
        where: { id: contestId },
      }),
    ]);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.team_profile) {
      return { success: false, message: "Team profile not found" };
    }

    if (!problem) {
      return { success: false, message: "Problem not found" };
    }

    if (!contest) {
      return { success: false, message: "Contest not found" };
    }

    // ============================================================
    // CATEGORY-SPECIFIC FILE SIZE VALIDATION
    // ============================================================
    const category = user.team_profile.category;

    const SIZE_LIMITS: Record<string, { bytes: number; label: string }> = {
      CORE: { bytes: 5 * 1024 * 1024, label: "5MB" },
      WEB: { bytes: 50 * 1024 * 1024, label: "50MB" },
      ANDROID: { bytes: 50 * 1024 * 1024, label: "50MB" },
    };

    const sizeLimit = SIZE_LIMITS[category] || SIZE_LIMITS.CORE;

    if (file.size > sizeLimit.bytes) {
      return {
        success: false,
        message: `File too large. Max limit for ${category} is ${sizeLimit.label}`,
      };
    }

    // ============================================================
    // SECURITY CHECKS (CRITICAL)
    // ============================================================

    // 3A: CROSS-CONTEST ISOLATION CHECK
    if (user.team_profile.assigned_contest_id !== problem.contestId) {
      return {
        success: false,
        message: `SECURITY_VIOLATION: Cross-contest submission blocked. Your team is assigned to a different contest.`,
      };
    }

    // 3B: TEAM BLOCKED STATUS CHECK (Kill Switch)
    if (user.team_profile.is_blocked) {
      return {
        success: false,
        message: `Your team has been blocked from submitting. Contact administrator.`,
      };
    }

    // 3C: CATEGORY ISOLATION CHECK
    if (user.team_profile.category !== problem.category) {
      return {
        success: false,
        message: `Category Mismatch! Your team is in ${user.team_profile.category} category, but this problem is for ${problem.category}.`,
      };
    }

    // ============================================================
    // FILE TYPE VALIDATION
    // ============================================================
    const fileExtension = getFileExtension(file.name);

    if (!validateFileType(fileExtension, user.team_profile.category)) {
      const allowedTypes: Record<string, string> = {
        CORE: ".c, .cpp, .cc, .cxx, .py, .java, .cs, .js, .ts, .go, .rs, .kt, .swift, .txt (NO zip/binaries)",
        WEB: ".zip, .rar, .7z, .tar, .gz",
        ANDROID: ".apk, .aab, .zip, .rar, .7z",
      };

      return {
        success: false,
        message: `Invalid file type '.${fileExtension}' for ${
          user.team_profile.category
        } category. Allowed: ${allowedTypes[user.team_profile.category]}`,
      };
    }

    const { filePath, fileHash } = await saveFile(
      file,
      contest.name,
      user.team_profile.display_name
    );

    // ============================================================
    // STEP 6: ATOMIC TRANSACTION - ρ-Constraint + DB Update
    // CRITICAL FIX (Audit Issue #2): Move ρ-Constraint check INSIDE transaction
    // with Serializable isolation to prevent TOCTOU race conditions
    // ============================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // ============================================================
        // ρ-CONSTRAINT CHECK (One Active Submission) - INSIDE TRANSACTION
        // This prevents race condition where two rapid clicks bypass the check
        // ============================================================
        const existingSubmission = await tx.submission.findFirst({
          where: {
            userId,
            problemId,
            isLatest: true,
          },
        });

        if (existingSubmission && !existingSubmission.canRetry) {
          throw new Error("DUPLICATE_SUBMISSION");
        }

        // Mark old submissions as not latest (if canRetry was true)
        if (existingSubmission) {
          await tx.submission.updateMany({
            where: {
              userId,
              problemId,
              isLatest: true,
            },
            data: {
              isLatest: false,
            },
          });
        }

        // Create new submission - AUTO-ACCEPTED (Count then Verify)
        const newSubmission = await tx.submission.create({
          data: {
            userId,
            problemId,
            fileUrl: filePath,
            fileHash,
            fileType: fileExtension,
            status: SubmissionStatus.ACCEPTED, // Auto-accept for instant feedback
            isLatest: true,
            canRetry: false,
            manualScore: 0, // Jury will update this later
          },
        });

        // ============================================================
        // INSTANT SCORING: Update TeamScore immediately
        // ============================================================
        const teamId = user.team_profile?.id;
        if (teamId) {
          const contestStartTime = contest.startTime;

          // Calculate submission time penalty
          const elapsedMs = new Date().getTime() - contestStartTime.getTime();
          const timeInMinutes = Math.floor(elapsedMs / 60000);

          // Upsert TeamScore
          const existingTeamScore = await tx.teamScore.upsert({
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
            update: {},
          });

          const problemStats =
            (existingTeamScore.problemStats as Record<string, any>) || {};
          const currentProblemStat = problemStats[problemId] || {
            solved: false,
            attempts: 0,
            penalty: 0,
            score: 0,
          };

          // Only increment if not already solved
          if (!currentProblemStat.solved) {
            const problemPenalty =
              timeInMinutes + currentProblemStat.attempts * 20;

            problemStats[problemId] = {
              solved: true,
              attempts: currentProblemStat.attempts + 1,
              penalty: problemPenalty,
              score: 0, // Jury will update
            };

            await tx.teamScore.update({
              where: {
                teamId_contestId: {
                  teamId,
                  contestId,
                },
              },
              data: {
                solvedCount: existingTeamScore.solvedCount + 1,
                totalPenalty: existingTeamScore.totalPenalty + problemPenalty,
                problemStats: problemStats as any,
              },
            });
          } else {
            // Already solved - just increment attempts
            problemStats[problemId] = {
              ...currentProblemStat,
              attempts: currentProblemStat.attempts + 1,
            };

            await tx.teamScore.update({
              where: {
                teamId_contestId: {
                  teamId,
                  contestId,
                },
              },
              data: {
                problemStats: problemStats as any,
              },
            });
          }
        }

        // Create system log
        await tx.systemLog.create({
          data: {
            action: "SUBMISSION",
            level: "INFO",
            message: `Team ${user.team_profile?.display_name} submitted solution for problem ${problem.title} (Auto-Accepted)`,
            details: `Submission ID: ${newSubmission.id}`,
            user_id: userId,
            submission_id: newSubmission.id,
            metadata: {
              problemId,
              contestId,
              fileType: fileExtension,
              teamCategory: user.team_profile?.category,
              problemCategory: problem.category,
              autoAccepted: true,
            },
          },
        });

        return newSubmission;
      },
      {
        isolationLevel: "Serializable", // CRITICAL: Prevent phantom reads and lost updates
        maxWait: 5000,
        timeout: 15000, // Allow more time for file operations
      }
    );

    // ============================================================
    // STEP 8: WEBSOCKET BROADCAST
    // ============================================================
    // Broadcast NEW_SUBMISSION for jury queue
    await broadcastContestUpdate("NEW_SUBMISSION", {
      submissionId: result.id,
      teamId: user.team_profile.id,
      problemId,
      contestId,
      teamName: user.team_profile.display_name,
      problemTitle: problem.title,
    });

    // Broadcast LEADERBOARD_UPDATE for real-time leaderboard refresh
    // This triggers immediate updates on all connected leaderboard clients
    await broadcastContestUpdate("LEADERBOARD_UPDATE", {
      teamId: user.team_profile.id,
      contestId,
      action: "SUBMISSION_ACCEPTED",
    });

    // Broadcast SUBMISSION_UPDATE for any other listeners
    await broadcastContestUpdate("SUBMISSION_UPDATE", {
      submissionId: result.id,
      status: "ACCEPTED",
      teamId: user.team_profile.id,
    });

    return {
      success: true,
      message: "Solution submitted successfully!",
      submissionId: result.id,
    };
  } catch (error) {
    console.error("Error submitting solution:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to submit solution",
    };
  }
}
