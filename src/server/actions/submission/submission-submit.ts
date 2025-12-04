"use server";

import { prisma } from "@/lib/prisma";
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
 * 1. Auth Check
 * 2. $Z$-Gate (Contest Access)
 * 3. Category Isolation Check
 * 4. ρ-Constraint (One Active Submission)
 * 5. File Type Validation
 * 6. Save File & Create Submission (Atomic)
 * 7. WebSocket Broadcast
 */
export async function submitSolution(formData: FormData): Promise<SubmitResponse> {
    try {
        // Extract form data
        const file = formData.get("file") as File | null;
        const problemId = formData.get("problemId") as string;
        const contestId = formData.get("contestId") as string;
        const userId = formData.get("userId") as string;

        // Basic validation
        if (!file) {
            return { success: false, message: "No file provided" };
        }

        if (!problemId || !contestId || !userId) {
            return { success: false, message: "Missing required fields" };
        }

        // ============================================================
        // CATEGORY-SPECIFIC FILE SIZE VALIDATION (SECURITY AUDIT V4.0)
        // ============================================================
        // Fetch team category first to determine size limit
        const tempUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { team_profile: true },
        });

        if (!tempUser || !tempUser.team_profile) {
            return { success: false, message: "Team profile not found" };
        }

        const category = tempUser.team_profile.category;

        // STRICT FILE SIZE LIMITS BY CATEGORY
        const SIZE_LIMITS: Record<string, { bytes: number; label: string }> = {
            CORE: { bytes: 5 * 1024 * 1024, label: "5MB" },      // 5MB for source code
            WEB: { bytes: 50 * 1024 * 1024, label: "50MB" },      // 50MB for web projects
            ANDROID: { bytes: 50 * 1024 * 1024, label: "50MB" },  // 50MB for APK files
        };

        const sizeLimit = SIZE_LIMITS[category] || SIZE_LIMITS.CORE;

        if (file.size > sizeLimit.bytes) {
            return {
                success: false,
                message: `File too large. Max limit for ${category} is ${sizeLimit.label}`
            };
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
        // STEP 2: Fetch Team, Problem, and Validate Relations
        // ============================================================
        const [user, problem] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: { team_profile: true },
            }),
            prisma.problem.findUnique({
                where: { id: problemId },
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

        // ============================================================
        // STEP 3: SECURITY CHECKS (CRITICAL)
        // ============================================================

        // 3A: CROSS-CONTEST ISOLATION CHECK
        // Prevent teams from submitting to problems in different contests
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
        // STEP 4: ρ-CONSTRAINT (One Active Submission)
        // ============================================================
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                userId,
                problemId,
                isLatest: true,
            },
        });

        if (existingSubmission && !existingSubmission.canRetry) {
            return {
                success: false,
                message: "You have already submitted a solution for this problem. Contact admin if you need to resubmit.",
            };
        }

        // ============================================================
        // STEP 5: FILE TYPE VALIDATION
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
                message: `Invalid file type '.${fileExtension}' for ${user.team_profile.category} category. Allowed: ${allowedTypes[user.team_profile.category]}`,
            };
        }

        // ============================================================
        // STEP 6: SAVE FILE TO DISK
        // ============================================================
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
        });

        if (!contest) {
            return { success: false, message: "Contest not found" };
        }

        const { filePath, fileHash } = await saveFile(
            file,
            contest.name,
            user.team_profile.display_name
        );

        // ============================================================
        // STEP 7: ATOMIC TRANSACTION - Update DB
        // ============================================================
        const result = await prisma.$transaction(async (tx) => {
            // Mark old submissions as not latest
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

            // Create new submission
            const newSubmission = await tx.submission.create({
                data: {
                    userId,
                    problemId,
                    fileUrl: filePath,
                    fileHash,
                    fileType: fileExtension,
                    status: SubmissionStatus.PENDING,
                    isLatest: true,
                    canRetry: false,
                },
            });

            // Create system log
            await tx.systemLog.create({
                data: {
                    action: "SUBMISSION",
                    level: "INFO",
                    message: `Team ${user.team_profile?.display_name} submitted solution for problem ${problem.title}`,
                    details: `Submission ID: ${newSubmission.id}`,
                    user_id: userId,
                    submission_id: newSubmission.id,
                    metadata: {
                        problemId,
                        contestId,
                        fileType: fileExtension,
                        teamCategory: user.team_profile?.category,
                        problemCategory: problem.category,
                    },
                },
            });

            return newSubmission;
        });

        // ============================================================
        // STEP 8: WEBSOCKET BROADCAST
        // ============================================================
        await broadcastContestUpdate("NEW_SUBMISSION", {
            submissionId: result.id,
            teamId: user.team_profile.id,
            problemId,
            contestId,
            teamName: user.team_profile.display_name,
            problemTitle: problem.title,
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
            message: error instanceof Error ? error.message : "Failed to submit solution",
        };
    }
}
