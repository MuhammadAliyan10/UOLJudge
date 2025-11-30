import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PausedOverlay } from "@/features/contest/components/PausedOverlay";
import { SubmissionCard } from "@/features/contest/components/SubmissionCard";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/shared/ui/table";
import { Badge } from "@/features/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/shared/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/features/shared/ui/button";

export const dynamic = "force-dynamic";

export default async function ProblemDetailPage({
    params,
}: {
    params: Promise<{ contestId: string; problemId: string }>;
}) {
    const { contestId, problemId } = await params;

    // 1. Auth Check
    const session = await getSession();
    if (!session || session.role !== "PARTICIPANT") {
        redirect("/login");
    }

    // 2. Fetch Contest & Pause State
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { isPaused: true, pausedAt: true, isActive: true },
    });

    if (!contest) return <div>Contest Not Found</div>;

    if (contest.isPaused) {
        return <PausedOverlay pausedAt={contest.pausedAt} />;
    }

    // 3. Fetch Problem Details
    const problem = await prisma.problem.findUnique({
        where: { id: problemId },
    });

    if (!problem) return <div>Problem Not Found</div>;

    // 4. Fetch Team Profile (for category check)
    const teamProfile = await prisma.teamProfile.findUnique({
        where: { user_id: session.userId },
    });

    if (!teamProfile || teamProfile.category !== problem.category) {
        return <div>Unauthorized: Problem category mismatch</div>;
    }

    // 5. Fetch Submissions History
    const submissions = await prisma.submission.findMany({
        where: {
            userId: session.userId,
            problemId: problemId,
        },
        orderBy: { submittedAt: "desc" },
    });

    // Determine current status
    const latestSubmission = submissions[0];
    const hasAccepted = submissions.some((s) => s.status === "ACCEPTED");

    // Can retry if admin explicitly allowed it on the latest submission
    const canRetry = latestSubmission?.canRetry || false;

    return (
        <div className="space-y-8 pb-12">
            {/* Back Button */}
            <div>
                <Link href={`/contest/${contestId}/problems`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Problems
                    </Button>
                </Link>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-slate-500">
                            {problem.category}
                        </Badge>
                        <Badge variant="secondary" className="font-mono">
                            {problem.points} PTS
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{problem.title}</h1>
                </div>

                {/* PDF Buttons (if contentUrl exists) */}
                {problem.contentUrl && (
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            asChild
                        >
                            <Link href={problem.contentUrl} target="_blank">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View PDF
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            asChild
                        >
                            <Link href={problem.contentUrl} download target="_blank">
                                <Download className="h-4 w-4" />
                                Download
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="prose prose-slate max-w-none bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Problem Description</h3>
                <div className="whitespace-pre-wrap text-slate-700">
                    {problem.description}
                </div>
            </div>

            {/* Submission Card */}
            <SubmissionCard
                problemId={problem.id}
                problemTitle={problem.title}
                problemType={problem.type}
                problemCategory={problem.category}
                contestId={contestId}
                userId={session.userId}
                contentUrl={problem.contentUrl}
                hasSubmission={submissions.length > 0}
                submissionStatus={latestSubmission?.status}
                canRetry={canRetry}
            />

            {/* History Table */}
            {submissions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Submission History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Language</TableHead>
                                    <TableHead className="text-right">Penalty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-mono text-xs">
                                            {format(new Date(sub.submittedAt), "HH:mm:ss")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    sub.status === "ACCEPTED"
                                                        ? "default"
                                                        : sub.status === "REJECTED"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className={
                                                    sub.status === "ACCEPTED"
                                                        ? "bg-green-500"
                                                        : sub.status === "PENDING"
                                                            ? "bg-yellow-500"
                                                            : ""
                                                }
                                            >
                                                {sub.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 uppercase">
                                            {sub.fileType}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {sub.penalty > 0 ? `+${sub.penalty}` : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
