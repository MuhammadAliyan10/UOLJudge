"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/shared/ui/card";
import { Button } from "@/features/shared/ui/button";
import { Textarea } from "@/features/shared/ui/textarea";
import { Input } from "@/features/shared/ui/input";
import { Label } from "@/features/shared/ui/label";
import { Badge } from "@/features/shared/ui/badge";
import { Separator } from "@/features/shared/ui/separator";
import { ScrollArea } from "@/features/shared/ui/scroll-area";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/features/shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/shared/ui/alert-dialog";
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
  Hand,
  ArrowLeft,
  AlertTriangle,
  Package,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { gradeSubmissionAction } from "@/server/actions/jury/jury-grading";
import { getSubmissionPreview } from "@/server/actions/jury/grading";
import { grantRetry } from "@/server/actions/submission/retry-system";
import { cn } from "@/lib/utils";
import {
  calculateSuggestedPenalty,
  getDifficultyColor,
  validateManualScore,
} from "@/lib/utils/scoring";
import { useSubmissionPresence } from "@/features/jury/hooks/useSubmissionPresence";
import { getFileTypeInfo } from "@/lib/utils/file-type";
import { CodePreview } from "@/features/jury/components/CodePreview";
import { BinaryFileCard } from "@/features/jury/components/BinaryFileCard";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { formatLocalTime } from "@/lib/utils/date";

interface GradingInterfaceProps {
  submission: any;
  history: Array<{
    timestamp: Date;
    username: string;
    message: string;
    details: string;
    metadata: any;
  }>;
  currentJuryUsername: string;
}

export function GradingInterface({
  submission,
  history,
  currentJuryUsername,
}: GradingInterfaceProps) {
  const router = useRouter();
  const [grading, setGrading] = useState(false);
  const [grantingRetry, setGrantingRetry] = useState(false);

  // AlertDialog states
  const [showRegradeDialog, setShowRegradeDialog] = useState(false);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [pendingVerdict, setPendingVerdict] = useState<
    "ACCEPTED" | "REJECTED" | null
  >(null);

  // Pre-fill if submission is already graded
  const isGraded =
    submission.status === "ACCEPTED" || submission.status === "REJECTED";
  const [comment, setComment] = useState(
    isGraded && submission.juryComment ? submission.juryComment : ""
  );
  const [manualScore, setManualScore] = useState<string>(
    isGraded && submission.manualScore != null
      ? String(submission.manualScore)
      : ""
  );

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isBinary, setIsBinary] = useState(false);
  const [loadingFile, setLoadingFile] = useState(true);

  // Debounced refresh for auto-updates
  const refresh = useDebouncedRefresh(500);

  // 🎯 Presence System (Headless - sends events but no UI)
  useSubmissionPresence(submission.id, currentJuryUsername);

  // 🔄 WebSocket Listener for conflict prevention
  useContestSocket({
    onSubmissionUpdate: (payload) => {
      // If this submission was graded by someone else, refresh to show updated status
      if (payload.submissionId === submission.id) {
        toast.info("This submission was just graded", {
          description: "Refreshing to show latest status...",
          duration: 3000,
        });
        refresh();
      }
    },
    onJuryQueueUpdate: (payload) => {
      // Refresh on any queue update to keep status in sync
      refresh();
    },
  });

  // File type detection
  const fileTypeInfo = useMemo(
    () => getFileTypeInfo(submission.fileType),
    [submission.fileType]
  );

  // Calculate penalty suggestion
  const penaltySuggestion = useMemo(() => {
    if (!submission.problem.contest || !submission.submittedAt) return null;

    return calculateSuggestedPenalty(
      new Date(submission.submittedAt),
      new Date(submission.problem.contest.startTime),
      {
        safeZoneMinutes: submission.problem.contest.safeZoneMinutes || 30,
        penaltyRate: submission.problem.contest.penaltyRate || 0.5,
        minScorePercent: submission.problem.contest.minScorePercent || 50,
      },
      submission.problem.points
    );
  }, [submission]);

  // Validate manual score
  const scoreValidation = useMemo(() => {
    const score = parseFloat(manualScore);
    if (isNaN(score) || manualScore === "") return { isValid: true };
    return validateManualScore(score, submission.problem.points);
  }, [manualScore, submission.problem.points]);

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
              setFileContent(
                truncated + "\n\n// ⚠️ FILE TRUNCATED - TOO LARGE FOR PREVIEW"
              );
              toast.warning(
                "File too large for preview. Download to view full content.",
                {
                  duration: 5000,
                }
              );
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
      setPendingVerdict(verdict);
      setShowRegradeDialog(true);
      return;
    }

    // Direct grading for PENDING submissions
    await performGrade(verdict);
  };

  const performGrade = async (verdict: "ACCEPTED" | "REJECTED") => {
    setGrading(true);

    try {
      const result = await gradeSubmissionAction(
        submission.id,
        verdict,
        comment.trim() || undefined,
        manualScore ? parseFloat(manualScore) : undefined
      );

      if (result.success) {
        toast.success(result.message || "Submission graded successfully");
        router.refresh();
        setComment("");
      } else {
        toast.error(result.error || "Failed to grade submission");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("An error occurred while grading");
    } finally {
      setGrading(false);
      setShowRegradeDialog(false);
      setPendingVerdict(null);
    }
  };

  const handleGrantRetry = async () => {
    setShowRetryDialog(true);
  };

  const performGrantRetry = async () => {
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
      setShowRetryDialog(false);
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
              <strong>Retry Request:</strong>{" "}
              {submission.retryReason || "No reason provided"}
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

        <PanelGroup
          direction="horizontal"
          className="h-[calc(100%-3rem)] gap-6"
        >
          {/* LEFT PANEL - File Viewer (60%) */}
          <Panel defaultSize={60} minSize={40}>
            <Card className="h-full border-slate-200 shadow-sm flex flex-col">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {fileTypeInfo.icon === "code" && (
                        <FileCode size={18} className="text-purple-600" />
                      )}
                      {fileTypeInfo.icon === "archive" && (
                        <Package size={18} className="text-purple-600" />
                      )}
                      {fileTypeInfo.icon === "mobile" && (
                        <Smartphone size={18} className="text-purple-600" />
                      )}
                      {fileTypeInfo.category === "code"
                        ? "Code Inspector"
                        : "File Inspector"}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs bg-slate-100 text-slate-700 border-slate-300"
                    >
                      {submission.fileType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Hash size={12} />
                      <span className="font-mono truncate">
                        {submission.fileHash.slice(0, 16)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={12} />
                      {formatLocalTime(submission.submittedAt)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative">
                {loadingFile ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    Loading file...
                  </div>
                ) : fileTypeInfo.category === "binary" || isBinary ? (
                  <BinaryFileCard
                    fileName={`submission.${submission.fileType}`}
                    fileType={submission.fileType}
                    downloadUrl={`/api/download/${submission.id}`}
                    iconType={fileTypeInfo.icon}
                  />
                ) : fileContent ? (
                  <CodePreview
                    content={fileContent}
                    language={fileTypeInfo.language}
                    fileName={`submission.${submission.fileType}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No content available
                  </div>
                )}
              </CardContent>
            </Card>
          </Panel>

          {/* RESIZE HANDLE */}
          <PanelResizeHandle className="w-2 bg-slate-200 hover:bg-purple-400 transition-colors rounded-full flex items-center justify-center group">
            <GripVertical
              size={16}
              className="text-slate-400 group-hover:text-white"
            />
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
                        {submission.user.team_profile?.display_name ||
                          "Unknown"}
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
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Problem</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-slate-900">
                          {submission.problem.title}
                        </p>
                        {submission.problem.difficulty && (
                          <Badge
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0 h-5",
                              getDifficultyColor(submission.problem.difficulty)
                                .bg,
                              getDifficultyColor(submission.problem.difficulty)
                                .text
                            )}
                          >
                            {submission.problem.difficulty === "EASY" && "🟢"}
                            {submission.problem.difficulty === "MEDIUM" && "🟡"}
                            {submission.problem.difficulty === "HARD" && "🔴"}
                            {submission.problem.difficulty}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {submission.problem.contest.name} •{" "}
                        {submission.problem.points} points
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
                  {/* Penalty Suggestion Card */}
                  {penaltySuggestion && penaltySuggestion.isLate && (
                    <Alert className="border-amber-300 bg-amber-50">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-900 font-bold text-sm">
                        Late Submission (+{penaltySuggestion.overtimeMinutes}{" "}
                        mins)
                      </AlertTitle>
                      <AlertDescription className="text-amber-800 text-xs space-y-1 mt-1">
                        <p>
                          <strong>Recommended Deduction:</strong> -
                          {penaltySuggestion.penalty} points
                        </p>
                        <p>
                          <strong>Policy:</strong> -
                          {submission.problem.contest.penaltyRate} pts/min after{" "}
                          {submission.problem.contest.safeZoneMinutes}m safe
                          zone
                        </p>
                        <p>
                          <strong>Max Possible Score:</strong>{" "}
                          {penaltySuggestion.maxPossibleScore}/
                          {submission.problem.points} points
                        </p>
                        <p className="text-amber-700 italic text-[10px]">
                          Floor at {submission.problem.contest.minScorePercent}%
                          = {penaltySuggestion.floorScore} points minimum
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* On-Time Submission Notice */}
                  {penaltySuggestion && !penaltySuggestion.isLate && (
                    <Alert className="border-green-300 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-xs">
                        <strong>On-Time Submission</strong> - No penalty applied
                        (within {submission.problem.contest.safeZoneMinutes}m
                        safe zone)
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Manual Score Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Award size={12} /> Manual Score
                    </Label>
                    <Input
                      type="number"
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value)}
                      placeholder={`Enter score (0-${submission.problem.points})`}
                      className={cn(
                        "bg-slate-50 border-slate-200 font-mono",
                        !scoreValidation.isValid && "border-red-500 bg-red-50"
                      )}
                      min="0"
                      max={submission.problem.points}
                      step="0.5"
                    />
                    {!scoreValidation.isValid && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {scoreValidation.error}
                      </p>
                    )}
                    {penaltySuggestion &&
                      penaltySuggestion.isLate &&
                      manualScore === "" && (
                        <p className="text-xs text-amber-700">
                          💡 Suggested: {penaltySuggestion.maxPossibleScore}{" "}
                          points (with penalty)
                        </p>
                      )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Comment / Reason
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Provide feedback or reason for verdict..."
                      className="min-h-[100px] bg-slate-50 border-slate-200 text-slate-900 resize-none"
                    />
                    <p className="text-xs text-slate-400">
                      {comment.trim()
                        ? ""
                        : "Required for rejection, optional for acceptance"}
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
                        {isGraded ? "UPDATE" : "ACCEPT"}
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
                        {isGraded ? "UPDATE" : "REJECT"}
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
                                  {new Date(
                                    entry.timestamp
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-slate-600">{entry.message}</p>
                              {entry.details && (
                                <p className="text-slate-500 italic text-[11px]">
                                  {entry.details}
                                </p>
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

        {/* Regrade Confirmation Dialog */}
        <AlertDialog
          open={showRegradeDialog}
          onOpenChange={setShowRegradeDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Re-grade</AlertDialogTitle>
              <AlertDialogDescription>
                This submission is already marked as{" "}
                <strong>{submission.status}</strong>. Are you sure you want to
                re-grade it as <strong>{pendingVerdict}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => pendingVerdict && performGrade(pendingVerdict)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirm Re-grade
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Retry Grant Confirmation Dialog */}
        <AlertDialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Grant Retry Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to grant a retry for this team? They will
                be able to submit again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={performGrantRetry}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Grant Retry
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
