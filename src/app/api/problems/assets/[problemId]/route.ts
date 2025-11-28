import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import { access, constants } from 'fs/promises';
import path from 'path';

// ============================================================
// CONFIGURATION
// ============================================================

const STORAGE_DIR = path.join(process.cwd(), 'storage');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validates file path to prevent path traversal attacks
 * @param filePath - The file path to validate
 * @returns true if path is safe and within storage directory
 */
function isPathSafe(filePath: string): boolean {
    // Resolve the absolute path
    const resolvedPath = path.resolve(filePath);

    // Check if path contains traversal sequences
    if (filePath.includes('../') || filePath.includes('..\\')) {
        return false;
    }

    // Ensure the resolved path is within the storage directory
    return resolvedPath.startsWith(STORAGE_DIR);
}

/**
 * Checks if a file exists and is readable
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath, constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

// ============================================================
// API ROUTE HANDLER
// ============================================================

/**
 * GET /api/problems/assets/[problemId]
 * 
 * Serves the problem PDF file to authenticated users
 * 
 * @security Requires ADMIN, JURY, or PARTICIPANT role
 * @param params.problemId - The ID of the problem
 * @returns PDF file stream with inline display
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ problemId: string }> }
) {
    try {
        // 1. Authentication & Authorization
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized: No active session' },
                { status: 401 }
            );
        }

        // Allow ADMIN, JURY, and PARTICIPANT roles
        const allowedRoles = ['ADMIN', 'JURY', 'PARTICIPANT'];
        if (!allowedRoles.includes(session.role)) {
            return NextResponse.json(
                {
                    error: 'Forbidden: Insufficient permissions',
                    message: 'This endpoint requires ADMIN, JURY, or PARTICIPANT role'
                },
                { status: 403 }
            );
        }

        // 2. Extract problemId from params
        const { problemId } = await params;

        if (!problemId) {
            return NextResponse.json(
                { error: 'Bad Request: problemId is required' },
                { status: 400 }
            );
        }

        // 3. Fetch Problem from Database
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            select: {
                id: true,
                title: true,
                assetsPath: true
            },
        });

        if (!problem) {
            return NextResponse.json(
                { error: 'Not Found: Problem not found' },
                { status: 404 }
            );
        }

        if (!problem.assetsPath) {
            return NextResponse.json(
                { error: 'Not Found: Problem assets file path is missing' },
                { status: 404 }
            );
        }

        // 4. Validate Path (Security Check)
        const filePath = path.join(process.cwd(), problem.assetsPath);

        if (!isPathSafe(problem.assetsPath)) {
            console.error(`[ASSETS_API] Path traversal attempt detected: ${problem.assetsPath}`);
            return NextResponse.json(
                { error: 'Forbidden: Invalid file path' },
                { status: 403 }
            );
        }

        // 5. Check File Existence
        const exists = await fileExists(filePath);

        if (!exists) {
            console.error(`[ASSETS_API] File not found: ${filePath}`);
            return NextResponse.json(
                { error: 'Not Found: Problem file does not exist' },
                { status: 404 }
            );
        }

        // 6. Read File and Stream Response
        const fileBuffer = await readFile(filePath);

        // Generate a safe filename from problem title
        const safeFilename = problem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeFilename}.pdf`;

        // 7. Return Response with Proper Headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
                'Content-Length': fileBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('[ASSETS_API] Error serving problem file:', error);

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: 'Failed to retrieve problem file'
            },
            { status: 500 }
        );
    }
}
