'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import {
    validateFileExtension,
    getLanguageFromExtension,
    generateFileHash,
    getStoragePath,
    generateFilename,
} from '@/lib/fileUtils';
import { revalidatePath } from 'next/cache';

// ============================================================
// TYPES
// ============================================================

export interface SubmissionResult {
    success: boolean;
    error?: string;
    submissionId?: string;
}

// ============================================================
// SUBMIT SOLUTION
// ============================================================

/**
 * Server action to handle code submission
 * Validates file, stores it locally, and creates database record
 */
export async function submitSolution(
    formData: FormData
): Promise<SubmissionResult> {
    try {
        // 1. Get authenticated session
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Not authenticated' };
        }

        // 2. RATE LIMITING: Check last submission time (15 sec cooldown)
        const lastSubmission = await prisma.submission.findFirst({
            where: { user_id: session.userId },
            orderBy: { submitted_at: 'desc' },
            select: { submitted_at: true },
        });

        if (lastSubmission) {
            const now = new Date();
            const timeSinceLastMs = now.getTime() - lastSubmission.submitted_at.getTime();
            const COOLDOWN_MS = 15 * 1000; // 15 seconds

            if (timeSinceLastMs < COOLDOWN_MS) {
                const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastMs) / 1000);
                return {
                    success: false,
                    error: `Please wait ${waitSeconds} seconds between submissions`
                };
            }
        }

        // 3. Parse form data
        const problemId = formData.get('problemId') as string;
        const file = formData.get('file') as File;

        if (!problemId || !file) {
            return { success: false, error: 'Missing required fields' };
        }

        // 3. Validate file size (50MB max)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return { success: false, error: 'File size exceeds 50MB limit' };
        }

        if (file.size === 0) {
            return { success: false, error: 'File is empty' };
        }

        // 4. Get team profile
        const teamProfile = await prisma.teamProfile.findUnique({
            where: { user_id: session.userId },
        });

        if (!teamProfile) {
            return { success: false, error: 'Team profile not found' };
        }

        // 5. Get problem and validate category
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { contest: true },
        });

        if (!problem) {
            return { success: false, error: 'Problem not found' };
        }

        // Category check - ensure team can only submit to their category
        if (problem.category !== teamProfile.category) {
            return {
                success: false,
                error: 'You can only submit solutions for your team category',
            };
        }

        // 6. Validate file extension matches category
        if (!validateFileExtension(file.name, problem.category)) {
            return {
                success: false,
                error: `Invalid file type for ${problem.category} category`,
            };
        }

        // 7. Check if contest is still active
        const now = new Date();
        if (now > problem.contest.end_time) {
            return { success: false, error: 'Contest has ended' };
        }

        if (now < problem.contest.start_time) {
            return { success: false, error: 'Contest has not started yet' };
        }

        // 8. Read file buffer and generate hash
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = generateFileHash(buffer);

        // 9. Create storage directory and save file
        const storagePath = getStoragePath(
            problem.contest_id,
            teamProfile.id,
            problemId
        );

        await fs.mkdir(storagePath, { recursive: true });

        const filename = generateFilename(file.name);
        const filepath = path.join(storagePath, filename);

        await fs.writeFile(filepath, buffer);

        // 10. Calculate penalty (time elapsed in minutes)
        const contestStart = problem.contest.start_time;
        const elapsedMs = now.getTime() - contestStart.getTime();
        const penalty = Math.floor(elapsedMs / 60000); // Convert to minutes

        // 11. Create submission record
        const submission = await prisma.submission.create({
            data: {
                user_id: session.userId,
                problem_id: problemId,
                file_path: filepath,
                file_hash: fileHash,
                language: getLanguageFromExtension(file.name),
                verdict: 'PENDING',
                auto_score: problem.points,
                final_score: 0, // Will be updated by admin/jury
                penalty,
            },
        });

        // 12. Revalidate the problems page to show new status
        revalidatePath('/contest/problems');

        return {
            success: true,
            submissionId: submission.id,
        };
    } catch (error) {
        console.error('[SUBMIT] Error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}
