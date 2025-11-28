"use client";

import { useState } from "react";
import { generateCeremonyHTML } from "@/server/actions/ceremony";
import { toast } from "sonner";
import {
  Trophy,
  Download,
  FileCode,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Hash,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CeremonyResultsPage() {
  const [contestId, setContestId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!contestId) {
      toast.error("Please enter a contest ID");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating ceremony artifact...");

    try {
      const result = await generateCeremonyHTML(contestId);

      if (!result.success) {
        toast.error(result.error || "Failed to generate ceremony", {
          id: toastId,
        });
        return;
      }

      // Create Blob and trigger download
      const blob = new Blob([result.html!], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "UOL_FINAL_RESULTS.html";
      a.click();

      URL.revokeObjectURL(url);

      toast.success("Ceremony file downloaded successfully!", { id: toastId });
    } catch (error) {
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Award Ceremony Export
        </h1>
        <p className="text-slate-500 mt-1">
          Generate a self-contained HTML file for the offline award ceremony.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Action Card */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Trophy size={20} className="text-amber-500" />
                Generator Configuration
              </CardTitle>
              <CardDescription>
                Identify the target contest to build the results artifact.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Input Group */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Hash size={14} className="text-slate-400" />
                  Contest UUID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={contestId}
                    onChange={(e) => setContestId(e.target.value)}
                    placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                    className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Copy the ID from the
                  <span className="font-medium text-slate-700">
                    Contests
                  </span>{" "}
                  page column.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleDownload}
                disabled={isGenerating || !contestId}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all shadow-sm",
                  isGenerating || !contestId
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-blue-200/50 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Building Artifact...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Download Ceremony HTML
                  </>
                )}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Features Info Card */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-sm bg-slate-50/50 h-full">
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <FileCode size={18} className="text-slate-500" />
                Artifact Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeatureItem text="Self-contained (Zero Dependencies)" />
              <FeatureItem text="Spacebar Reveal Animation" />
              <FeatureItem text="Automatic CSS Confetti" />
              <FeatureItem text="Embedded Assets (Base64)" />
              <FeatureItem text="Optimized Size (< 2MB)" />

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">Usage:</span>{" "}
                  Download this file to a USB drive. Open it on the auditorium
                  laptop using Chrome or Edge (F11 for Fullscreen).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="min-w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <CheckCircle2 size={12} strokeWidth={3} />
      </div>
      <span>{text}</span>
    </div>
  );
}
