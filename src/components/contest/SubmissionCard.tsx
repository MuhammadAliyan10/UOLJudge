"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FileCode,
    FileArchive,
    File,
    CheckCircle,
    XCircle,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { submitSolution } from "@/server/actions/submit";
import { toast } from "sonner";
import type { ProblemType, Category, SubmissionStatus } from "@prisma/client";

interface SubmissionCardProps {
    problemId: string;
    problemTitle: string;
    problemType: ProblemType;
    problemCategory: Category;
    contestId: string;
    userId: string;
    contentUrl?: string | null;

    // Submission status
    hasSubmission?: boolean;
    submissionStatus?: SubmissionStatus | null;
    canRetry?: boolean;
}

/**
 * SubmissionCard Component
 * Handles file submission with category-specific validation
 */
export function SubmissionCard({
    problemId,
    problemTitle,
    problemType,
    problemCategory,
    contestId,
    userId,
    contentUrl,
    hasSubmission = false,
    submissionStatus = null,
    canRetry = false,
}: SubmissionCardProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // Determine file accept attribute based on category
    const getAcceptAttribute = (): string => {
        const acceptMap: Record<Category, string> = {
            CORE: ".cpp,.c,.java,.py",
            WEB: ".zip",
            ANDROID: ".apk",
        };
        return acceptMap[problemCategory] || "*";
    };

    // Determine icon based on category
    const getCategoryIcon = () => {
        switch (problemCategory) {
            case "WEB":
                return <FileArchive className="h-5 w-5" />;
            case "ANDROID":
                return <File className="h-5 w-5" />;
            default:
                return <FileCode className="h-5 w-5" />;
        }
    };

    // Check if submission is disabled
    const isSubmissionDisabled = hasSubmission && !canRetry;

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("problemId", problemId);
            formData.append("contestId", contestId);
            formData.append("userId", userId);

            const result = await submitSolution(formData);

            if (result.success) {
                toast.success(result.message);
                setFile(null);
                // Reset file input
                const fileInput = document.getElementById(`file-${problemId}`) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getCategoryIcon()}
                        <div>
                            <CardTitle className="text-lg">{problemTitle}</CardTitle>
                            <CardDescription>
                                Category: {problemCategory} • Type: {problemType}
                            </CardDescription>
                        </div>
                    </div>

                    {/* Status Badge */}
                    {hasSubmission && (
                        <Badge
                            variant={
                                submissionStatus === "ACCEPTED"
                                    ? "default"
                                    : submissionStatus === "REJECTED"
                                        ? "destructive"
                                        : "outline"
                            }
                            className={
                                submissionStatus === "ACCEPTED"
                                    ? "bg-green-500"
                                    : submissionStatus === "PENDING"
                                        ? "bg-yellow-500"
                                        : ""
                            }
                        >
                            {submissionStatus === "ACCEPTED" && (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Accepted</>
                            )}
                            {submissionStatus === "REJECTED" && (
                                <><XCircle className="h-3 w-3 mr-1" /> Rejected</>
                            )}
                            {submissionStatus === "PENDING" && (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Pending</>
                            )}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {/* PDF Viewer Button for DIGITAL problems */}
                {problemType === "DIGITAL" && contentUrl && (
                    <div className="mb-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(contentUrl, "_blank")}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            📄 Open Problem PDF
                        </Button>
                    </div>
                )}

                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor={`file-${problemId}`}>
                            Solution File ({getAcceptAttribute()})
                        </Label>
                        <Input
                            id={`file-${problemId}`}
                            type="file"
                            accept={getAcceptAttribute()}
                            onChange={handleFileChange}
                            disabled={isSubmissionDisabled || loading}
                            className="mt-1"
                        />
                        {file && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

                    {/* Submission Status Message */}
                    {isSubmissionDisabled && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-700 font-medium">
                                ✅ Solution already submitted! Contact jury if you need to resubmit.
                            </p>
                        </div>
                    )}

                    {canRetry && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-700 font-medium">
                                ⚠️ Jury has allowed you to resubmit for this problem.
                            </p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmissionDisabled || loading || !file}
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                        ) : (
                            "Submit Solution"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
