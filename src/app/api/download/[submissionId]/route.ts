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

        // 3. Security: Ensure file is in storage directory
        const storagePath = path.join(process.cwd(), 'storage');
        const absolutePath = path.resolve(submission.fileUrl);

        if (!absolutePath.startsWith(storagePath)) {
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

        // 5. Get filename
        const filename = path.basename(submission.fileUrl);

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
