"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit, ListChecks, Clock, Trash2, ToggleLeft, ToggleRight, Snowflake } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/features/shared/ui/dropdown-menu";
import { Button } from "@/features/shared/ui/button";
import { EditContestDialog } from "./EditContestDialog";
import { ManageProblemsDialog } from "./ManageProblemsDialog";
import { ExtendContestDialog } from "./ExtendContestDialog";
import { DeleteContestDialog } from "./DeleteContestDialog";
import { toast } from "sonner";
import { updateContestAction, toggleContestFreezeAction } from "@/server/actions/admin/admin";

export function ContestActions({ contest }: { contest: any }) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openProblems, setOpenProblems] = useState(false);
  const [openExtend, setOpenExtend] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isTogglingFreeze, setIsTogglingFreeze] = useState(false);

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);

    try {
      // Create FormData matching updateContestAction signature
      const formData = new FormData();
      formData.append("id", contest.id);
      formData.append("name", contest.name);
      formData.append("startTime", new Date(contest.startTime).toISOString());
      formData.append("endTime", new Date(contest.endTime).toISOString());
      formData.append("isActive", (!contest.isActive).toString());

      const result = await updateContestAction(formData);

      if (result.success) {
        toast.success(
          contest.isActive
            ? "Contest deactivated successfully"
            : "Contest activated successfully"
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update contest status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleToggleFreeze = async () => {
    setIsTogglingFreeze(true);
    try {
      const result = await toggleContestFreezeAction(contest.id);

      if (result.success) {
        const isFrozen = contest.frozenAt !== null;
        toast.success(isFrozen ? "Leaderboard unfrozen" : "Leaderboard frozen");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to toggle freeze");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsTogglingFreeze(false);
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
            <Edit className="mr-2 h-4 w-4" /> Edit Contest
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenExtend(true)}>
            <Clock className="mr-2 h-4 w-4" /> Extend Time
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
          >
            {contest.isActive ? (
              <>
                <ToggleLeft className="mr-2 h-4 w-4" /> Deactivate
              </>
            ) : (
              <>
                <ToggleRight className="mr-2 h-4 w-4" /> Activate
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleToggleFreeze}
            disabled={isTogglingFreeze}
          >
            <Snowflake className="mr-2 h-4 w-4" />
            {contest.frozenAt ? "Unfreeze Leaderboard" : "Freeze Leaderboard"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setOpenProblems(true)}>
            <ListChecks className="mr-2 h-4 w-4" /> Manage Problems
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Contest
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <EditContestDialog
        contest={contest}
        open={openEdit}
        onOpenChange={setOpenEdit}
      />
      <ManageProblemsDialog
        contestId={contest.id}
        contestName={contest.name}
        contestCategory={contest.category}
        existingProblems={contest.problems}
        open={openProblems}
        onOpenChange={setOpenProblems}
      />
      <ExtendContestDialog
        contestId={contest.id}
        contestName={contest.name}
        open={openExtend}
        onOpenChange={setOpenExtend}
      />
      <DeleteContestDialog
        contestId={contest.id}
        contestName={contest.name}
        open={openDelete}
        onOpenChange={setOpenDelete}
      />
    </>
  );
}
