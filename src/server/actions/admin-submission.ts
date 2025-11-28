"use server";

import { prisma } from "@/lib/prisma";

/**
 * Admin Override Actions
 */

interface AdminResponse {
    success: boolean;
    message: string;
}

/**
 * Allow Resubmission
 * Sets canRetry = true and status = REJECTED for a submission
 * Allows team to submit again for the same problem
 */
export async function allowResubmission(submissionId: string): Promise<AdminResponse> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Update submission
            const submission = await tx.submission.update({
                where: { id: submissionId },
                data: {
                    canRetry: true,
                    status: "REJECTED",
                },
                include: {
                    user: {
                        include: {
                            team_profile: true,
                        },
                    },
                    problem: true,
                },
            });

            // Create system log
            await tx.systemLog.create({
                data: {
                    action: "MANUAL_GRADE_UPDATE",
                    level: "WARN",
                    message: `Admin Override: Allowed resubmission for Team ${submission.user.team_profile?.display_name}`,
                    details: `Submission ID: ${submissionId}, Problem: ${submission.problem.title}`,
                    user_id: submission.userId,
                    submission_id: submissionId,
                    metadata: {
                        action: "ALLOW_RESUBMISSION",
                        problemId: submission.problemId,
                    },
                },
            });

            return submission;
        });

        return {
            success: true,
            message: `Resubmission allowed for ${result.user.team_profile?.display_name}`,
        };
    } catch (error) {
        console.error("Error allowing resubmission:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to allow resubmission",
        };
    }
}
