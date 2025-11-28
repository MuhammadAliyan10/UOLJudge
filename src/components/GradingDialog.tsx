"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubmissionStatus } from "@prisma/client";
import {
  gradeSubmission,
  getSubmissionPreview,
} from "@/server/actions/grading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Download,
  Package,
  AlertTriangle,
  Loader2,
  Gavel,
} from "lucide-react";

interface GradingDialogProps {
  submission: {
    id: string;
    autoScore: number;
    fileUrl: string;
    problem: {
      id: string;
      title: string;
      points: number;
    };
    user: {
      username: string;
      team_profile: {
        display_name: string;
      } | null;
    };
  };
}

export function GradingDialog({ submission }: GradingDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isBinary, setIsBinary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState<string>("");
  const [juryComment, setJuryComment] = useState("");

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoadingFile(true);
    setError(null);

    try {
      const result = await getSubmissionPreview(submission.id);
      if (result.success) {
        if (result.isBinary) {
          setIsBinary(true);
        } else {
          setFileContent(result.content || "");
        }
      } else {
        setError(result.error || "Failed to load file");
      }
    } catch (err) {
      setError("Network error loading file");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleGrade = async (verdict: "ACCEPTED" | "REJECTED") => {
    setIsGrading(true);
    setError(null);

    const score = manualScore ? parseInt(manualScore) : undefined;

    // Validation
    if (score && (score < 0 || score > submission.problem.points)) {
      setError(`Score must be between 0 and ${submission.problem.points}`);
      setIsGrading(false);
      return;
    }

    try {
      const result = await gradeSubmission(
        submission.id,
        verdict,
        score,
        juryComment || undefined
      );

      if (result.success) {
        toast.success(`Submission marked as ${verdict}`);
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.message || "Grading failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        size="sm"
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
      >
        <Gavel size={16} className="mr-2" />
        Grade
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh]! flex flex-col p-0 gap-0 overflow-hidden bg-white border-slate-200 shadow-2xl rounded-xl">
          {/* Header */}
          <DialogHeader className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {submission.problem.title}
                  <Badge
                    variant="secondary"
                    className="font-mono text-sm px-2.5"
                  >
                    {submission.problem.points} PTS
                  </Badge>
                </DialogTitle>
                <DialogDescription className="mt-1.5 flex items-center gap-2 text-slate-500 text-sm">
                  <span className="font-semibold text-slate-700">
                    {submission.user.team_profile?.display_name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono">@{submission.user.username}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content (Split View) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
            {/* Left: File Viewer (3/5) */}
            <div className="lg:col-span-3 border-r border-slate-200 bg-slate-900 overflow-hidden flex flex-col relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge
                  variant="outline"
                  className="bg-slate-800 text-slate-400 border-slate-700 font-mono text-xs"
                >
                  Read-Only Preview
                </Badge>
              </div>

              {isLoadingFile ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Loader2
                    size={40}
                    className="animate-spin mb-4 text-primary"
                  />
                  <p>Loading submission file...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-8 text-center">
                  <AlertTriangle size={40} className="mb-4" />
                  <p className="font-medium text-lg">{error}</p>
                </div>
              ) : isBinary ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Package size={64} className="mb-6 text-slate-600" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    Binary File Detected
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 max-w-sm text-center leading-relaxed">
                    This file format cannot be previewed directly. Please
                    download it to inspect locally.
                  </p>
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-base"
                  >
                    <a
                      href={`/api/download/${submission.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={18} className="mr-2" /> Download Artifact
                    </a>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <pre className="p-8 text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <code>{fileContent}</code>
                  </pre>
                </ScrollArea>
              )}
            </div>

            {/* Right: Controls (2/5) */}
            <div className="lg:col-span-2 bg-white p-8 overflow-y-auto flex flex-col gap-8">
              {/* Score Display */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Automated Grading
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">
                    Calculated Score
                  </span>
                  <span className="text-3xl font-black text-primary tabular-nums">
                    {submission.autoScore}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
                <p className="text-xs text-slate-400 mt-3 text-right font-medium">
                  Max possible: {submission.problem.points}
                </p>
              </div>

              {/* Manual Override */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900">
                  Manual Override{" "}
                  <span className="text-slate-400 font-normal ml-1">
                    (Optional)
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max={submission.problem.points}
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    placeholder="Enter custom score..."
                    className="pl-4 pr-12 font-mono h-12 text-base"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold tracking-wider">
                    PTS
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Leave empty to accept the auto-score of{" "}
                  <strong className="text-slate-700">
                    {submission.autoScore}
                  </strong>
                  .
                </p>
              </div>

              {/* Comments */}
              <div className="space-y-3 flex-1">
                <label className="text-sm font-semibold text-slate-900">
                  Jury Feedback
                </label>
                <Textarea
                  value={juryComment}
                  onChange={(e) => setJuryComment(e.target.value)}
                  placeholder="Explain your decision (this will be visible to the team)..."
                  className="min-h-[150px] resize-none text-sm p-4 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleGrade("REJECTED")}
                  disabled={isGrading}
                  variant="outline"
                  className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-14 text-base font-semibold"
                >
                  {isGrading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={20} className="mr-2" />
                  )}
                  Reject
                </Button>

                <Button
                  onClick={() => handleGrade("ACCEPTED")}
                  disabled={isGrading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 shadow-md shadow-emerald-100 text-base font-semibold"
                >
                  {isGrading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={20} className="mr-2" />
                  )}
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
