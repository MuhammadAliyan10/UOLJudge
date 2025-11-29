"use client";

import { useState } from "react";
import { generateCeremonyHTML } from "@/server/actions/ceremony";
import { toast } from "sonner";
import {
  Download,
  FileCode,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Hash,
  Terminal,
  MonitorPlay
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Award Ceremony Export
          </h1>
          <p className="text-slate-500 font-medium">
            Generate standalone HTML artifacts for offline presentations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator Card */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden ring-1 ring-slate-950/5">
              <CardHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Builder</span>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Terminal size={20} className="text-slate-400" />
                  Generate Package
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Compile results, assets, and animations into a single distributable file.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Hash size={12} /> Target Contest UUID
                  </Label>
                  <div className="relative">
                    <Input
                      value={contestId}
                      onChange={(e) => setContestId(e.target.value)}
                      placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                      className="h-12 pl-4 pr-4 bg-slate-50 border-slate-200 font-mono text-sm focus:bg-white transition-all shadow-inner text-slate-900"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">UUID v4</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Ensure the contest has "Ended" status before generation for final results.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleDownload}
                    disabled={isGenerating || !contestId}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-tight shadow-md transition-all border border-slate-900 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Compiling Assets...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5 opacity-80" />
                        Build & Download Artifact
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Specs Card */}
          <div className="lg:col-span-1">
            <Card className="border border-slate-200 shadow-sm bg-slate-50/50 h-full rounded-lg ring-1 ring-slate-950/5">
              <CardHeader className="px-6 py-5 border-b border-slate-200/50">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileCode size={18} className="text-slate-400" />
                  Technical Specs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-3">
                  <FeatureItem text="Zero Dependencies (Offline Ready)" />
                  <FeatureItem text="Embedded Base64 Assets" />
                  <FeatureItem text="CSS3 Confetti Engine" />
                  <FeatureItem text="Spacebar Reveal Actions" />
                  <FeatureItem text="Low Latency (< 16ms render)" />
                </div>

                <div className="pt-5 border-t border-slate-200/50 mt-2">
                  <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm">
                    <MonitorPlay size={16} className="text-indigo-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Usage Guide</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Copy to USB. Open in Chrome/Edge. Press <kbd className="font-mono bg-slate-100 px-1 rounded border border-slate-200 text-slate-700 font-bold">F11</kbd> for fullscreen presentation mode.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <div className="min-w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
        <CheckCircle2 size={10} strokeWidth={4} />
      </div>
      <span className="font-medium text-xs uppercase tracking-wide text-slate-500">{text}</span>
    </div>
  );
}
