'use server';

import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Verdict } from '@prisma/client';

// ============================================================
// TYPES
// ============================================================

export interface GradingResult {
    success: boolean;
    error?: string;
}

export interface FilePreviewResult {
    success: boolean;
    content?: string;
    isBinary?: boolean;
    error?: string;
}

// ============================================================
// READ SUBMISSION FILE (FOR PREVIEW)
// ============================================================

export async function getSubmissionPreview(
    submissionId: string
): Promise<FilePreviewResult> {
    try {
        const session = await getSession();

        if (!session || (session.role !== 'ADMIN' && session.role !== 'JURY')) {
            return { success: false, error: 'Unauthorized' };
        }

        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
        });

        if (!submission) {
            return { success: false, error: 'Submission not found' };
        }

        // Check if binary
        const ext = submission.file_path.split('.').pop()?.toLowerCase();
        const isBinary = ext === 'zip' || ext === 'apk';

        if (isBinary) {
            return { success: true, isBinary: true };
        }

        // Read text file securely
        try {
            const { promises: fs } = await import('fs');
            const path = await import('path');

            // Security: Ensure file is in storage directory
            const storagePath = path.join(process.cwd(), 'storage');
            const absolutePath = path.resolve(submission.file_path);

            if (!absolutePath.startsWith(storagePath)) {
                return { success: false, error: 'Access denied: File outside storage directory' };
            }

            const content = await fs.readFile(absolutePath, 'utf-8');
            return { success: true, content, isBinary: false };
        } catch (error) {
            return { success: false, error: 'File not found or unreadable' };
        }
    } catch (error) {
        console.error('[PREVIEW] Error:', error);
        return { success: false, error: 'Failed to read file' };
    }
}

// ============================================================
// GRADE SUBMISSION (WITH ICPC PENALTIES)
// ============================================================

/**
 * Grade a submission and update team scores transactionally
 * ICPC Rules: 20 minute penalty for each previous REJECTED submission
 */
export async function gradeSubmission(
    submissionId: string,
    verdict: Verdict,
    manualScore?: number,
    juryComment?: string
): Promise<GradingResult> {
    try {
        // 1. Verify admin/jury role
        const session = await getSession();

        if (!session || (session.role !== 'ADMIN' && session.role !== 'JURY')) {
            return { success: false, error: 'Unauthorized' };
        }

        // 2. Use transaction for atomic updates
        await prisma.$transaction(async (tx) => {
            // Fetch submission with related data
            const submission = await tx.submission.findUnique({
                where: { id: submissionId },
                include: {
                    problem: { include: { contest: true } },
                    user: { include: { team_profile: true } },
                },
            });

            if (!submission) {
                throw new Error('Submission not found');
            }

            // Validate manual score
            if (manualScore !== undefined && manualScore > submission.problem.points) {
                throw new Error('Manual score exceeds problem points');
            }

            // 3. Calculate ICPC-style penalty
            let penalty = 0;

            if (verdict === 'ACCEPTED') {
                // Base penalty: time from contest start
                const contestStart = submission.problem.contest.start_time;
                const submissionTime = submission.submitted_at;
                const elapsedMs = submissionTime.getTime() - contestStart.getTime();
                const baseMinutes = Math.floor(elapsedMs / 60000);

                // Count previous REJECTED submissions for THIS problem by THIS user
                const previousRejections = await tx.submission.count({
                    where: {
                        user_id: submission.user_id,
                        problem_id: submission.problem_id,
                        verdict: 'REJECTED',
                        submitted_at: { lt: submission.submitted_at },
                    },
                });

                // ICPC Rule: Add 20 minutes per previous rejection
                penalty = baseMinutes + (previousRejections * 20);
            }

            // 4. Calculate final score
            const finalScore = verdict === 'ACCEPTED'
                ? (manualScore ?? submission.auto_score)
                : 0;

            // 5. Update submission (use judged_by_id, no judged_at in schema)
            await tx.submission.update({
                where: { id: submissionId },
                data: {
                    verdict,
                    final_score: finalScore,
                    penalty,
                    judged_by_id: session.userId,
                    jury_comment: juryComment || null,
                },
            });

            // 6. Recalculate team totals
            const allAcceptedSubmissions = await tx.submission.findMany({
                where: {
                    user_id: submission.user_id,
                    verdict: 'ACCEPTED',
                },
            });

            const totalScore = allAcceptedSubmissions.reduce(
                (sum: number, s) => sum + s.final_score, 0
            );

            const totalPenalty = allAcceptedSubmissions.reduce(
                (sum: number, s) => sum + s.penalty, 0
            );

            // 7. Update team profile
            await tx.teamProfile.update({
                where: { user_id: submission.user_id },
                data: {
                    total_score: totalScore,
                    total_penalty: totalPenalty,
                },
            });

            // 8. Create audit log
            await tx.systemLog.create({
                data: {
                    action: 'MANUAL_GRADE_UPDATE',
                    details: `Graded ${submission.user.team_profile?.display_name || 'Team'} on ${submission.problem.title}: ${verdict} (${finalScore} pts, ${penalty} min penalty)`,
                    user_id: session.userId,
                },
            });
        });

        // 9. Revalidate affected pages
        revalidatePath('/leaderboard', 'page');
        revalidatePath('/admin/grading', 'page');
        revalidatePath('/contest/problems', 'page');
        revalidatePath('/contest/submissions', 'page');

        return { success: true };
    } catch (error) {
        console.error('[GRADING] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Grading failed',
        };
    }
}
