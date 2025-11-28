"use client";

import { useState, useRef } from "react";
import { Category } from "@prisma/client";
import { submitSolution } from "@/server/actions/submit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UploadCloud, File, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitDialogProps {
  problemId: string;
  category: Category;
  contestEndTime: Date;
  onClose: () => void;
  onSuccess: () => void;
}

// Validation Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const FILE_RULES: Record<Category, { extensions: string[]; label: string }> = {
  CORE: {
    extensions: [".cpp", ".c", ".cc", ".java", ".py"],
    label: "Source Code (.cpp, .java, .py)",
  },
  WEB: {
    extensions: [".zip"],
    label: "Project Archive (.zip)",
  },
  ANDROID: {
    extensions: [".apk"],
    label: "Android Package (.apk)",
  },
};

export function SubmitDialog({
  problemId,
  category,
  contestEndTime,
  onClose,
  onSuccess,
}: SubmitDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExpired = new Date() > new Date(contestEndTime);
  const rules = FILE_RULES[category];

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);

    // 1. Check Size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File exceeds the 50MB size limit.");
      return;
    }

    // 2. Check Extension
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = rules.extensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!isValidExtension) {
      setError(`Invalid file type. Allowed: ${rules.extensions.join(", ")}`);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isExpired) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("problemId", problemId);
    formData.append("category", category);

    try {
      const result = await submitSolution(formData);
      if (result.success) {
        toast.success("Solution submitted successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || "Submission failed");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white text-slate-900 border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Submit Solution
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Upload your solution for the <strong>{category}</strong> category.
          </DialogDescription>
        </DialogHeader>

        {isExpired ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium text-sm">
              Contest has ended. Submissions closed.
            </span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                file
                  ? "border-emerald-500 bg-emerald-50/50"
                  : error
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300 hover:border-primary hover:bg-slate-50"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept={rules.extensions.join(",")}
              />

              {file ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <File size={24} />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 truncate max-w-[250px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X size={14} className="mr-1" /> Remove
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                      error
                        ? "bg-red-100 text-red-500"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {error ? (
                      <AlertCircle size={24} />
                    ) : (
                      <UploadCloud size={24} />
                    )}
                  </div>

                  {error ? (
                    <p className="text-sm font-medium text-red-600 max-w-[250px]">
                      {error}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-900">
                        Click to browse or drag file
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium">
                        Allowed: {rules.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Max size 50MB
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || isSubmitting || isExpired}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              "Confirm Submission"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
