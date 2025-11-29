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
  Layers,
  Hash,
  Trophy,
  LayoutGrid,
  AlertTriangle
} from "lucide-react";
import { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  contestCategory: Category;
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
  contestCategory,
  existingProblems,
  open,
  onOpenChange,
}: ManageProblemsDialogProps) {
  const [mode, setMode] = useState<"PAPER" | "PDF">("PAPER");
  const [loading, setLoading] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<string | null>(null);

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
  const handleDelete = async () => {
    if (!problemToDelete) return;

    const res = await deleteProblemAction(problemToDelete);
    if (res.success) {
      toast.success("Problem deleted");
      setProblemToDelete(null);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px]! p-0 bg-white border-slate-200 shadow-2xl rounded-lg ring-1 ring-slate-950/5 flex flex-col max-h-[90vh]!">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Configuration</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Manage Problems
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Contest: <span className="font-semibold text-slate-700">{contestName}</span> ({contestCategory})
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* LEFT: CREATE FORM */}
          <div className="w-full md:w-[400px] bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
              <h3 className="flex items-center gap-2 font-bold text-xs text-slate-500 uppercase tracking-wider">
                <Plus size={14} /> New Entry
              </h3>
            </div>

            <ScrollArea className="flex-1">
              <form
                onSubmit={handleCreate}
                className="p-6 space-y-5"
              >
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Problem Title</Label>
                  <Input
                    name="title"
                    placeholder={`Problem ${String.fromCharCode(65 + existingProblems.length)}`}
                    required
                    className="h-9 bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Trophy size={10} /> Points
                    </Label>
                    <Input
                      name="points"
                      type="number"
                      defaultValue={100}
                      required
                      className="h-9 bg-slate-50 border-slate-200 focus:bg-white font-mono text-slate-900"
                    />
                  </div>
                  {/* Hidden Category - Defaulting to Contest Category */}
                  <input type="hidden" name="category" value={contestCategory} />
                </div>

                <div className="space-y-3 pt-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Input Mode</Label>
                  <RadioGroup
                    defaultValue="PAPER"
                    onValueChange={(v) => setMode(v as "PAPER" | "PDF")}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="relative">
                      <RadioGroupItem value="PAPER" id="paper" className="peer sr-only" />
                      <Label
                        htmlFor="paper"
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 peer-data-[state=checked]:text-indigo-700 cursor-pointer transition-all h-full"
                      >
                        <StickyNote size={18} className="mb-1" />
                        <span className="text-xs font-bold text-center">Paper Mode</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="PDF" id="pdf" className="peer sr-only" />
                      <Label
                        htmlFor="pdf"
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 peer-data-[state=checked]:text-indigo-700 cursor-pointer transition-all h-full"
                      >
                        <FileText size={18} className="mb-1" />
                        <span className="text-xs font-bold text-center">Digital PDF</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {mode === "PDF" && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-md border border-slate-200 border-dashed">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <FileUp size={14} className="text-indigo-500" /> Upload Statement
                    </Label>
                    <Input
                      name="file"
                      type="file"
                      accept=".pdf"
                      required
                      className="bg-white border-slate-200 text-xs h-9"
                    />
                    <p className="text-[10px] text-slate-400">Supported formats: .pdf (Max 5MB)</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-sm font-bold tracking-tight h-10 border border-slate-900"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" size={16} />
                    ) : (
                      <Plus size={16} className="mr-2" />
                    )}
                    Create Problem Slot
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </div>

          {/* RIGHT: EXISTING LIST */}
          <div className="flex-1 bg-slate-50/50 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between sticky top-0">
              <h3 className="flex items-center gap-2 font-bold text-xs text-slate-500 uppercase tracking-wider">
                <LayoutGrid size={14} /> Registered Problems
              </h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {existingProblems.length}
              </span>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-3">
                {existingProblems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    <Hash size={32} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">No problems configured</p>
                  </div>
                ) : (
                  existingProblems.map((p) => {
                    const Icon = CATEGORY_ICONS[p.category];
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-lg group hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-slate-100 border border-slate-200 text-slate-700 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 leading-none">ID</span>
                            <span className="text-lg font-bold leading-none mt-0.5">{String.fromCharCode(65 + p.order_index)}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 text-sm block">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                <Icon size={10} className="text-slate-400" /> {p.category}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                <Trophy size={10} className="text-amber-500" /> {p.points}pts
                              </span>
                              {p.assets_path && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600">
                                  <FileText size={10} /> PDF Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <AlertDialog open={problemToDelete === p.id} onOpenChange={(open) => !open && setProblemToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                              onClick={() => setProblemToDelete(p.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-slate-200">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle size={20} /> Delete Problem?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-600">
                                This will permanently delete <span className="font-semibold text-slate-900">{p.title}</span> and all associated submissions. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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