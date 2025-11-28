"use client";

import { useState } from "react";
import {
  createProblemAction,
  deleteProblemAction,
} from "@/server/actions/problems";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  FileText,
  Loader2,
  Cpu,
  Globe,
  Smartphone,
  FileUp,
  StickyNote,
} from "lucide-react";
import { Category } from "@prisma/client"; // Assuming Category is imported correctly

interface Problem {
  id: string;
  title: string;
  category: Category;
  points: number;
  assets_path: string | null;
  order_index: number;
}

interface ManageProblemsDialogProps {
  contestId: string;
  contestName: string;
  existingProblems: Problem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  CORE: Cpu,
  WEB: Globe,
  ANDROID: Smartphone,
};

export function ManageProblemsDialog({
  contestId,
  contestName,
  existingProblems,
  open,
  onOpenChange,
}: ManageProblemsDialogProps) {
  const [mode, setMode] = useState<"PAPER" | "PDF">("PAPER");
  const [loading, setLoading] = useState(false);

  // --- CREATE HANDLER ---
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("contestId", contestId);
    formData.append("mode", mode);

    const res = await createProblemAction(formData);

    if (res.success) {
      toast.success(
        `Problem ${String.fromCharCode(65 + existingProblems.length)} added`
      );
      (e.target as HTMLFormElement).reset(); // Reset form fields
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  // --- DELETE HANDLER ---
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem? Submissions will be lost.")) return;
    const res = await deleteProblemAction(id);
    if (res.success) toast.success("Problem deleted");
    else toast.error(res.error);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-slate-200 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Problems: {contestName}</DialogTitle>
          <DialogDescription>
            Add or remove problems for this contest.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden pt-4">
          {/* LEFT: CREATE FORM */}
          <form
            onSubmit={handleCreate}
            className="space-y-4 border-r border-slate-100 pr-4 overflow-y-auto"
          >
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide mb-2">
              Add New Problem
            </h3>

            <div className="space-y-2">
              <Label className="text-sm">Problem Title</Label>
              <Input
                name="title"
                placeholder={`Problem ${String.fromCharCode(
                  65 + existingProblems.length
                )}`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Points (Default 100)</Label>
                <Input
                  name="points"
                  type="number"
                  defaultValue={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <Select name="category" required defaultValue="CORE">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">Core</SelectItem>
                    <SelectItem value="WEB">Web</SelectItem>
                    <SelectItem value="ANDROID">Android</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <Label className="text-sm">Content Type</Label>
              <RadioGroup
                defaultValue="PAPER"
                onValueChange={(v) => setMode(v as "PAPER" | "PDF")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PAPER" id="paper" />
                  <Label
                    htmlFor="paper"
                    className="flex items-center gap-1 cursor-pointer text-slate-600"
                  >
                    <StickyNote size={14} className="text-slate-400" /> Paper
                    (Title Only)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PDF" id="pdf" />
                  <Label
                    htmlFor="pdf"
                    className="flex items-center gap-1 cursor-pointer text-slate-600"
                  >
                    <FileText size={14} className="text-slate-400" /> Digital
                    (PDF Upload)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "PDF" && (
              <div className="space-y-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                <Label className="text-sm text-blue-700 flex items-center gap-1">
                  <FileUp size={14} /> Upload Problem Statement (.pdf)
                </Label>
                <Input
                  name="file"
                  type="file"
                  accept=".pdf"
                  required
                  className="bg-white"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Plus size={16} />
              )}
              Create Problem Slot
            </Button>
          </form>

          {/* RIGHT: EXISTING LIST */}
          <div className="space-y-4 flex flex-col h-full">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">
              Existing Problems ({existingProblems.length})
            </h3>
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-2">
                {existingProblems.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    No problems have been generated for this contest yet.
                  </p>
                ) : (
                  existingProblems.map((p) => {
                    const Icon = CATEGORY_ICONS[p.category];
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-sm font-bold text-slate-800 shadow-sm">
                            {String.fromCharCode(65 + p.order_index)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 text-sm truncate max-w-[150px] block">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-white border px-1.5 rounded text-slate-500 flex items-center gap-1">
                                <Icon size={10} /> {p.category}
                              </span>
                              {p.assets_path && (
                                <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                                  <FileText size={10} /> PDF Uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
