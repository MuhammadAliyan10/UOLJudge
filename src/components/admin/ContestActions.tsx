"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, ListChecks } from "lucide-react"; // Import ListChecks
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditContestDialog } from "./EditContestDialog";
import { ManageProblemsDialog } from "./problems/ManageProblemsDialog"; // Import new component

export function ContestActions({ contest }: { contest: any }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openProblems, setOpenProblems] = useState(false); // New state

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Config
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setOpenProblems(true)}>
            <ListChecks className="mr-2 h-4 w-4" /> Manage Problems
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
        existingProblems={contest.problems} // Make sure parent fetches this!
        open={openProblems}
        onOpenChange={setOpenProblems}
      />
    </>
  );
}
