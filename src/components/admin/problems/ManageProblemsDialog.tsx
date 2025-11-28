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
import { toast } from "sonner";
import { Plus, Trash2, FileText, StickyNote, Loader2 } from "lucide-react";
import { Category } from "@prisma/client";

interface Problem {
  id: string;
  title: string;
  category: Category;
  points: number;
  assets_path: string | null;
}

interface ManageProblemsDialogProps {
  contestId: string;
  contestName: string;
  existingProblems: Problem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
      toast.success("Problem added");
      // Optional: Reset form or keep open to add more
      (e.target as HTMLFormElement).reset();
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
      <DialogContent className="max-w-5xl! bg-white border-slate-200 max-h-[90vh]! overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Problems: {contestName}</DialogTitle>
          <DialogDescription>
            Add or remove problems for this contest.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          {/* LEFT: CREATE FORM */}
          <form
            onSubmit={handleCreate}
            className="space-y-4 border-r border-slate-100 pr-4"
          >
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-2">
              Add New Problem
            </h3>

            <div className="space-y-2">
              <Label>Problem Title</Label>
              <Input
                name="title"
                placeholder="e.g. Matrix Multiplication"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  name="points"
                  type="number"
                  defaultValue={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" defaultValue="CORE">
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

            <div className="space-y-3">
              <Label>Content Type</Label>
              <RadioGroup
                defaultValue="PAPER"
                onValueChange={(v) => setMode(v as "PAPER" | "PDF")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PAPER" id="paper" />
                  <Label
                    htmlFor="paper"
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <StickyNote size={14} /> Hardcopy (Paper)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PDF" id="pdf" />
                  <Label
                    htmlFor="pdf"
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <FileText size={14} /> Softcopy (PDF)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "PDF" && (
              <div className="space-y-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                <Label className="text-blue-700">Upload Problem PDF</Label>
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
              className="w-full bg-primary gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              Create Problem
            </Button>
          </form>

          {/* RIGHT: EXISTING LIST */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-2">
              Existing Problems ({existingProblems.length})
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {existingProblems.length === 0 ? (
                <p className="text-sm text-slate-400 italic">
                  No problems yet.
                </p>
              ) : (
                existingProblems.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-blue-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-sm w-6">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="font-medium text-slate-900 text-sm truncate max-w-[150px]">
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-8">
                        <span className="text-[10px] bg-white border px-1.5 rounded text-slate-500">
                          {p.category}
                        </span>
                        {p.assets_path && (
                          <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                            <FileText size={10} /> PDF
                          </span>
                        )}
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
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
