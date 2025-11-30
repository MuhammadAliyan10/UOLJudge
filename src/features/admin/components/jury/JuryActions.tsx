"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/shared/ui/dropdown-menu";
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
import { Button } from "@/features/shared/ui/button";
import { deleteJuryMemberAction } from "@/server/actions/jury/jury-management";
import { toast } from "sonner";
import { EditJuryAssignmentsDialog } from "./EditJuryAssignmentsDialog";

interface JuryActionsProps {
    jury: {
        id: string;
        username: string;
        assignedContests: Array<{
            id: string;
            name: string;
        }>;
    };
}

export function JuryActions({ jury }: JuryActionsProps) {
    const [deleting, setDeleting] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        const res = await deleteJuryMemberAction(jury.id);

        if (res.success) {
            toast.success(res.message || "Jury member deleted");
            window.location.reload();
        } else {
            toast.error(res.error || "Failed to delete");
        }
        setDeleting(false);
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical size={14} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                        <Pencil size={14} className="mr-2" />
                        Edit Assignments
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => setDeleteDialogOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 size={14} className="mr-2" />
                        Delete Jury
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditJuryAssignmentsDialog
                jury={jury}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle size={20} />
                            Delete Jury Member?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-900">
                                {jury.username}
                            </span>
                            ? This action cannot be undone and will remove all their contest assignments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
