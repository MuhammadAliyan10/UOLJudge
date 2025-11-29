import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { createReadStream, statSync } from 'fs';
import path from 'path';

// ============================================================
// SECURE FILE DOWNLOAD ENDPOINT
// ============================================================

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ submissionId: string }> }
) {
    const params = await context.params;

    try {
        // 1. Verify user is ADMIN or JURY
        const session = await getSession();

        if (!session || (session.role !== 'ADMIN' && session.role !== 'JURY')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // 2. Find submission in DB
        const submission = await prisma.submission.findUnique({
            where: { id: params.submissionId },
            include: { problem: true, user: { include: { team_profile: true } } },
        });

        if (!submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            );
        }

        // 3. Security: Ensure file is in public directory
        const publicPath = path.join(process.cwd(), 'public');
        let absolutePath = submission.fileUrl;

        // Handle relative paths starting with /uploads
        if (absolutePath.startsWith('/uploads')) {
            absolutePath = path.join(process.cwd(), 'public', absolutePath);
        } else if (!path.isAbsolute(absolutePath)) {
            absolutePath = path.join(publicPath, absolutePath);
        }

        // Normalize path
        absolutePath = path.resolve(absolutePath);

        if (!absolutePath.startsWith(publicPath)) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // 4. Check file exists
        try {
            const stats = statSync(absolutePath);

            if (!stats.isFile()) {
                return NextResponse.json(
                    { error: 'File not found' },
                    { status: 404 }
                );
            }
        } catch {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // 5. Get filename with custom naming logic
        let filename = path.basename(submission.fileUrl);
        const ext = path.extname(filename) || (submission.fileType.startsWith('.') ? submission.fileType : `.${submission.fileType}`);

        const category = submission.problem.category;

        if (category === 'CORE') {
            // For CORE problems, use Problem Name
            const safeTitle = submission.problem.title.replace(/[^a-zA-Z0-9-_]/g, '_');
            filename = `${safeTitle}${ext}`;
        } else if (category === 'WEB' || category === 'ANDROID') {
            // For WEB/APK, use Team Name
            const teamName = submission.user.team_profile?.display_name || 'UnknownTeam';
            const safeTeamName = teamName.replace(/[^a-zA-Z0-9-_]/g, '_');
            filename = `${safeTeamName}${ext}`;
        }

        // 6. Create read stream and return file
        const fileStream = createReadStream(absolutePath);

        // Convert stream to buffer for Next.js response
        const chunks: Buffer[] = [];
        for await (const chunk of fileStream) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        // 7. Return with proper headers
        return new NextResponse(buffer, {
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/octet-stream',
            },
        });
    } catch (error) {
        console.error('[DOWNLOAD] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
