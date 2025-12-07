import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { createReadStream, statSync } from "fs";
import path from "path";

// ============================================================
// SECURE FILE DOWNLOAD ENDPOINT - The "Secure Stream"
// Z-Gate Security:
// - Admin: Full access
// - Jury: Must be assigned to submission's contest
// - Participant: Can only download own submissions
// ============================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  const params = await context.params;

  try {
    // 1. SESSION CHECK
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Login required" },
        { status: 401 }
      );
    }

    // 2. Find submission in DB
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        problem: {
          select: {
            category: true,
            title: true,
            contestId: true,
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
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 3. Z-GATE AUTHORIZATION CHECK
    let authorized = false;

    if (session.role === "ADMIN") {
      // Admins have full access
      authorized = true;
    } else if (session.role === "JURY") {
      // Jury must be assigned to this contest
      const assignment = await prisma.juryAssignment.findFirst({
        where: {
          userId: session.userId,
          contestId: submission.problem.contestId,
        },
      });
      authorized = !!assignment;
    } else if (session.role === "PARTICIPANT") {
      // Participants can only download their own submissions
      authorized = submission.userId === session.userId;
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Access denied: You do not have permission to download this file",
        },
        { status: 403 }
      );
    }

    // 4. Resolve file path from storage directory
    const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/storage";
    let absolutePath: string;

    if (path.isAbsolute(submission.fileUrl)) {
      // Handle absolute paths (legacy)
      absolutePath = submission.fileUrl;
    } else {
      // Handle relative paths: "contest/team/file.zip"
      absolutePath = path.join(UPLOAD_DIR, submission.fileUrl);
    }

    // Normalize path to resolve any .. or . segments
    absolutePath = path.resolve(absolutePath);

    // Security: Ensure file is within storage directory (prevent path traversal)
    const resolvedStorageDir = path.resolve(UPLOAD_DIR);
    if (!absolutePath.startsWith(resolvedStorageDir)) {
      return NextResponse.json(
        { error: "Access denied: Invalid file path" },
        { status: 403 }
      );
    }

    // 4. Check file exists
    try {
      const stats = statSync(absolutePath);

      if (!stats.isFile()) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 5. Get filename with custom naming logic
    let filename = path.basename(submission.fileUrl);
    const ext =
      path.extname(filename) ||
      (submission.fileType.startsWith(".")
        ? submission.fileType
        : `.${submission.fileType}`);

    const category = submission.problem.category;

    if (category === "CORE") {
      // For CORE problems, use Problem Name
      const safeTitle = submission.problem.title.replace(
        /[^a-zA-Z0-9-_]/g,
        "_"
      );
      filename = `${safeTitle}${ext}`;
    } else if (category === "WEB" || category === "ANDROID") {
      // For WEB/APK, use Team Name
      const teamName =
        submission.user.team_profile?.display_name || "UnknownTeam";
      const safeTeamName = teamName.replace(/[^a-zA-Z0-9-_]/g, "_");
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
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("[DOWNLOAD] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
