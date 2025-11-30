"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { Button } from "@/features/shared/ui/button";
import { CheckCircle, XCircle, Download, Loader2, Clock } from "lucide-react";
import { gradeSubmission } from "@/server/actions/jury/grading";
import { toast } from "sonner";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import type { SubmissionStatus, Category } from "@prisma/client";

interface PendingSubmission {
    id: string;
    teamName: string;
    problemTitle: string;
    category: Category;
    fileUrl: string;
    submittedAt: Date;
    timeAgo: string;
}

/**
 * Admin Grading Dashboard
 * Two-column layout: Pending list + Grading panel
 */
export default function GradingDashboard({
    initialSubmissions,
}: {
    initialSubmissions: PendingSubmission[];
}) {
    const [submissions, setSubmissions] = useState<PendingSubmission[]>(initialSubmissions);
    const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);
    const [gradingLoading, setGradingLoading] = useState(false);

    // WebSocket for real-time updates
    useContestSocket({
        onStatusUpdate: (payload) => {
            if (payload.contestId) {
                // Refresh submissions list
                window.location.reload(); // Simple approach, or use SWR/React-Query
            }
        },
    });

    // Handle grading
    const handleGrade = async (status: "ACCEPTED" | "REJECTED") => {
        if (!selectedSubmission) return;

        setGradingLoading(true);

        try {
            const result = await gradeSubmission(selectedSubmission.id, status);

            if (result.success) {
                toast.success(result.message);

                // Remove from pending list
                setSubmissions((prev) => prev.filter((s) => s.id !== selectedSubmission.id));
                setSelectedSubmission(null);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to grade submission");
        } finally {
            setGradingLoading(false);
        }
    };

    // Calculate time ago
    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Pending Submissions List */}
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Submissions</CardTitle>
                        <CardDescription>
                            {submissions.length} awaiting review
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {submissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No pending submissions
                            </p>
                        ) : (
                            submissions.map((submission) => (
                                <button
                                    key={submission.id}
                                    onClick={() => setSelectedSubmission(submission)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSubmission?.id === submission.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {submission.teamName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {submission.problemTitle}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="ml-2">
                                            {submission.category}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {getTimeAgo(submission.submittedAt)}
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Column - Grading Panel */}
            <div className="lg:col-span-2">
                {selectedSubmission ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Grade Submission</CardTitle>
                            <CardDescription>
                                Review and grade the selected submission
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Submission Details */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Team</p>
                                        <p className="text-lg font-semibold">{selectedSubmission.teamName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Problem</p>
                                        <p className="text-lg font-semibold">{selectedSubmission.problemTitle}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                                        <Badge>{selectedSubmission.category}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                                        <p className="text-sm">{getTimeAgo(selectedSubmission.submittedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Download Button */}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(selectedSubmission.fileUrl, "_blank")}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Submission File
                            </Button>

                            {/* Grading Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    size="lg"
                                    className="bg-green-600 hover:bg-green-700 h-16"
                                    onClick={() => handleGrade("ACCEPTED")}
                                    disabled={gradingLoading}
                                >
                                    {gradingLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Accept
                                        </>
                                    )}
                                </Button>

                                <Button
                                    size="lg"
                                    variant="destructive"
                                    className="h-16"
                                    onClick={() => handleGrade("REJECTED")}
                                    disabled={gradingLoading}
                                >
                                    {gradingLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <XCircle className="h-5 w-5 mr-2" />
                                            Reject
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-16">
                            <p className="text-center text-muted-foreground">
                                Select a submission from the list to begin grading
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
