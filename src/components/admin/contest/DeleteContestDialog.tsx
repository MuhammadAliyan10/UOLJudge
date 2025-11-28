"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
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
            <DialogContent className="sm:max-w-md bg-white border-slate-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-900">
                        <Trash2 size={20} className="text-red-600" />
                        Delete Contest
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription className="text-sm">
                            Deleting this contest will permanently remove:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>All contest problems</li>
                                <li>All participant submissions</li>
                                <li>All team scores for this contest</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-1">Contest to delete:</p>
                        <p className="font-semibold text-slate-900">{contestName}</p>
                        <code className="text-xs text-slate-500 font-mono">
                            ID: {contestId.slice(0, 8)}
                        </code>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="border-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Confirm Delete
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
