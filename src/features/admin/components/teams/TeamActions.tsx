"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit, Shield, ShieldOff, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/features/shared/ui/dropdown-menu";
import { Button } from "@/features/shared/ui/button";
import { EditTeamDialog } from "./EditTeamDialog";
import { deleteTeamAction } from "@/server/actions/admin/admin";
import { toggleTeamBlock } from "@/server/actions/team/team-control";
import { toast } from "sonner";
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

export function TeamActions({ team }: { team: any }) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      const result = await toggleTeamBlock(team.id);
      if (result.success) {
        toast.success(result.isBlocked ? "Team blocked" : "Team unblocked");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to toggle block status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTeamAction(team.id);
      if (result.success) {
        toast.success("Team deleted successfully");
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete team");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white w-48">
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleBlock} disabled={isBlocking}>
            {team.team_profile?.is_blocked ? (
              <>
                <ShieldOff className="mr-2 h-4 w-4" /> Unblock Team
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" /> Block Team
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTeamDialog team={team} open={openEdit} onOpenChange={setOpenEdit} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{team.team_profile?.display_name}</strong> and all their submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
