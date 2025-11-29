"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteContestAction } from "@/server/actions/admin";

interface DeleteContestDialogProps {
    contestId: string;
    contestName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteContestDialog({
    contestId,
    contestName,
    open,
    onOpenChange,
}: DeleteContestDialogProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const result = await deleteContestAction(contestId);

            if (result.success) {
                toast.success("Contest deleted successfully");
                router.refresh();
                onOpenChange(false);
            } else {
                toast.error(result.error || "Failed to delete contest");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 border-slate-200 shadow-xl overflow-hidden rounded-lg ring-1 ring-slate-950/5">
                <div className="bg-red-50/50 border-b border-red-100 px-6 py-5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-red-600/70">Critical Action</span>
                    </div>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 tracking-tight">
                        Delete Contest
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm mt-1">
                        This action cannot be undone. Please confirm your intent.
                    </DialogDescription>
                </div>

                <div className="px-6 py-6 space-y-5">
                    <div className="flex gap-3 p-4 rounded-md bg-amber-50 border border-amber-100 text-amber-900">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold">Warning: Permanent Data Loss</h4>
                            <p className="text-xs text-amber-800/80 leading-relaxed">
                                Deleting this contest will permanently remove all associated problems, participant submissions, and leaderboards.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pl-1">Target Contest</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-900 text-sm">{contestName}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-mono text-slate-400">ID:</span>
                                    <code className="text-[10px] bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-600 font-mono">
                                        {contestId}
                                    </code>
                                </div>
                            </div>
                            <Trash2 className="h-4 w-4 text-red-300" />
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="h-9 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-9 bg-red-600 hover:bg-red-700 text-white border border-red-700 shadow-sm font-medium"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={14} className="animate-spin mr-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                Confirm Deletion
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}