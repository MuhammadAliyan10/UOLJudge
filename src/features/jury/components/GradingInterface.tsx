"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/shared/ui/card";
import { Button } from "@/features/shared/ui/button";
import { Textarea } from "@/features/shared/ui/textarea";
import { Badge } from "@/features/shared/ui/badge";
import { Separator } from "@/features/shared/ui/separator";
import { ScrollArea } from "@/features/shared/ui/scroll-area";
import {
    FileCode,
    CheckCircle,
    XCircle,
    Download,
    Clock,
    User,
    MapPin,
    Hash,
    Award,
    GripVertical,
    History,
    MessageSquare,
    Copy,
    Hand,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { gradeSubmissionAction } from "@/server/actions/jury/jury-grading";
import { getSubmissionPreview } from "@/server/actions/jury/grading";
import { grantRetry } from "@/server/actions/submission/retry-system";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/features/shared/ui/alert";

interface GradingInterfaceProps {
    submission: any;
    history: Array<{
        timestamp: Date;
        username: string;
        message: string;
        details: string;
        metadata: any;
    }>;
}

export function GradingInterface({ submission, history }: GradingInterfaceProps) {
    const router = useRouter();
    const [grading, setGrading] = useState(false);
    const [grantingRetry, setGrantingRetry] = useState(false);
    const [comment, setComment] = useState("");
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isBinary, setIsBinary] = useState(false);
    const [loadingFile, setLoadingFile] = useState(true);

    // Fetch file content on mount with size protection
    useEffect(() => {
        async function loadFileContent() {
            try {
                const result = await getSubmissionPreview(submission.id);
                if (result.success) {
                    if (result.isBinary) {
                        setIsBinary(true);
                    } else if (result.content) {
                        // PROTECTION: Truncate files larger than 50KB to prevent browser crash
                        const maxSize = 50 * 1024; // 50KB
                        const contentSize = new Blob([result.content]).size;

                        if (contentSize > maxSize) {
                            const truncated = result.content.slice(0, maxSize);
                            setFileContent(truncated + "\n\n// ⚠️ FILE TRUNCATED - TOO LARGE FOR PREVIEW");
                            toast.warning("File too large for preview. Download to view full content.", {
                                duration: 5000,
                            });
                        } else {
                            setFileContent(result.content);
                        }
                    } else {
                        setFileContent(null);
                    }
                } else {
                    toast.error(result.error || "Failed to load file");
                }
            } catch (error) {
                console.error("Error loading file:", error);
                toast.error("Failed to load submission file");
            } finally {
                setLoadingFile(false);
            }
        }

        loadFileContent();
    }, [submission.id]);

    const handleGrade = async (verdict: "ACCEPTED" | "REJECTED") => {
        if (verdict === "REJECTED" && !comment.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        // Confirm re-grade if already graded
        if (submission.status !== "PENDING") {
            const confirmRegrade = confirm(
                `This submission is already marked as ${submission.status}. Re-grade it as ${verdict}?`
            );
            if (!confirmRegrade) return;
        }

        setGrading(true);

        try {
            const result = await gradeSubmissionAction(
                submission.id,
                verdict,
                comment.trim() || undefined
            );

            if (result.success) {
                toast.success(result.message || "Submission graded successfully");
                // Refresh to show updated history instead of redirecting
                router.refresh();
                setComment(""); // Clear comment after successful grade
            } else {
                toast.error(result.error || "Failed to grade submission");
            }
        } catch (error) {
            console.error("Error grading submission:", error);
            toast.error("An error occurred while grading");
        } finally {
            setGrading(false);
        }
    };

    const getLanguageFromFileType = (fileType: string) => {
        const map: Record<string, string> = {
            cpp: "cpp",
            java: "java",
            py: "python",
            js: "javascript",
            ts: "typescript",
            c: "c",
            cs: "csharp",
        };
        return map[fileType] || "plaintext";
    };

    const handleCopyCode = () => {
        if (fileContent) {
            navigator.clipboard.writeText(fileContent);
            toast.success("Code copied to clipboard!");
        }
    };

    const handleGrantRetry = async () => {
        if (!confirm("Grant retry request for this team? They will be able to submit again.")) {
            return;
        }

        setGrantingRetry(true);

        try {
            const result = await grantRetry(submission.id);

            if (result.success) {
                toast.success(result.message || "Retry granted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to grant retry");
            }
        } catch (error) {
            console.error("Error granting retry:", error);
            toast.error("An error occurred while granting retry");
        } finally {
            setGrantingRetry(false);
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] p-6">
            <div className="h-full max-w-[1600px] mx-auto space-y-4">
                {/* Retry Request Alert */}
                {submission.retryRequested && !submission.canRetry && (
                    <Alert className="border-orange-300 bg-orange-50">
                        <Hand className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="ml-2 text-orange-900">
                            <strong>Retry Request:</strong> {submission.retryReason || "No reason provided"}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Back Button */}
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/jury/submissions")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Submissions
                    </Button>
                </div>

                <PanelGroup direction="horizontal" className="h-[calc(100%-3rem)] gap-6">
                    {/* LEFT PANEL - Code Viewer (60%) */}
                    <Panel defaultSize={60} minSize={40}>
                        <Card className="h-full border-slate-200 shadow-sm flex flex-col">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <FileCode size={18} className="text-purple-600" />
                                            Code Inspector
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {!isBinary && fileContent && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleCopyCode}
                                                    className="h-7 px-2 text-xs"
                                                >
                                                    <Copy size={12} className="mr-1" />
                                                    Copy
                                                </Button>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className="font-mono text-xs bg-slate-100 text-slate-700 border-slate-300"
                                            >
                                                {submission.fileType.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Hash size={12} />
                                            <span className="font-mono truncate">{submission.fileHash.slice(0, 16)}...</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock size={12} />
                                            {new Date(submission.submittedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 overflow-hidden">
                                {loadingFile ? (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        Loading file...
                                    </div>
                                ) : isBinary ? (
                                    <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
                                        <div className="p-4 bg-slate-100 rounded-full">
                                            <Download size={32} className="text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">
                                            Binary file ({submission.fileType.toUpperCase()})
                                        </p>
                                        <p className="text-xs text-slate-400 text-center max-w-md">
                                            This file cannot be previewed. Download it to review the submission.
                                        </p>
                                        <a href={`/api/download/${submission.id}`} download>
                                            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                                <Download size={14} className="mr-2" />
                                                Download File
                                            </Button>
                                        </a>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-full overflow-y-auto">
                                        <pre className="p-6 text-sm font-mono bg-slate-900 text-slate-100 overflow-x-auto">
                                            <code className={`language-${getLanguageFromFileType(submission.fileType)}`}>
                                                {fileContent || "// No content available"}
                                            </code>
                                        </pre>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </Panel>

                    {/* RESIZE HANDLE */}
                    <PanelResizeHandle className="w-2 bg-slate-200 hover:bg-purple-400 transition-colors rounded-full flex items-center justify-center group">
                        <GripVertical size={16} className="text-slate-400 group-hover:text-white" />
                    </PanelResizeHandle>

                    {/* RIGHT PANEL - Grading Controls (40%) */}
                    <Panel defaultSize={40} minSize={30} className="overflow-y-auto!">
                        <div className="h-full flex flex-col gap-6">
                            {/* Submission Info Card */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="text-sm font-bold text-slate-900">
                                        Submission Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <User size={14} className="text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500">Team</p>
                                            <p className="font-bold text-slate-900">
                                                {submission.user.team_profile?.display_name || "Unknown"}
                                            </p>
                                        </div>
                                    </div>
                                    {submission.user.team_profile?.lab_location && (
                                        <div className="flex items-start gap-3">
                                            <MapPin size={14} className="text-slate-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-slate-500">Location</p>
                                                <p className="text-sm text-slate-700">
                                                    {submission.user.team_profile.lab_location}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex items-start gap-3">
                                        <Award size={14} className="text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500">Problem</p>
                                            <p className="font-mono font-bold text-slate-900">
                                                {submission.problem.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {submission.problem.contest.name} • {submission.problem.points} points
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Grading Controls Card */}
                            <Card className="border-slate-200 shadow-sm flex-1 flex flex-col ">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <MessageSquare size={14} />
                                        Verdict & Feedback
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-2 flex-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Comment / Reason
                                        </label>
                                        <Textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Provide feedback or reason for verdict..."
                                            className="min-h-[120px] bg-slate-50 border-slate-200 text-slate-900 resize-none"
                                        />
                                        <p className="text-xs text-slate-400">
                                            {comment.trim() ? "" : "Required for rejection, optional for acceptance"}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Submit Verdict
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                onClick={() => handleGrade("ACCEPTED")}
                                                disabled={grading}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-sm"
                                            >
                                                <CheckCircle size={16} className="mr-2" />
                                                ACCEPT
                                            </Button>
                                            <Button
                                                onClick={() => handleGrade("REJECTED")}
                                                disabled={grading || !comment.trim()}
                                                className={cn(
                                                    "bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-sm",
                                                    !comment.trim() && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <XCircle size={16} className="mr-2" />
                                                REJECT
                                            </Button>
                                        </div>

                                        {/* Grant Retry Button */}
                                        {submission.retryRequested && !submission.canRetry && (
                                            <Button
                                                onClick={handleGrantRetry}
                                                disabled={grantingRetry}
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 shadow-sm mt-2"
                                            >
                                                <Hand size={16} className="mr-2" />
                                                {grantingRetry ? "Granting..." : "Grant Retry Request"}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* History Timeline Card */}
                            <Card className="border-slate-200 shadow-sm max-h-[300px] flex flex-col">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <History size={14} />
                                        Grading History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-hidden">
                                    <ScrollArea className="h-full overflow-y-autos">
                                        {history.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-8">
                                                No grading history yet
                                            </p>
                                        ) : (
                                            <div className="p-4 space-y-3">
                                                {history.map((entry, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex gap-3 text-xs pb-3 border-b border-slate-100 last:border-0"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div className="h-2 w-2 rounded-full bg-purple-400" />
                                                            {idx < history.length - 1 && (
                                                                <div className="flex-1 w-px bg-slate-200 mt-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <code className="font-mono font-bold text-slate-900">
                                                                    {entry.username}
                                                                </code>
                                                                <span className="text-slate-400">
                                                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-600">{entry.message}</p>
                                                            {entry.details && (
                                                                <p className="text-slate-500 italic text-[11px]">{entry.details}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
