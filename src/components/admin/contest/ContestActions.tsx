"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, ListChecks, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditContestDialog } from "./EditContestDialog";
import { ManageProblemsDialog } from "./ManageProblemsDialog";
import { ExtendContestDialog } from "./ExtendContestDialog"; // <-- NEW IMPORT

export function ContestActions({ contest }: { contest: any }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openProblems, setOpenProblems] = useState(false);
  const [openExtend, setOpenExtend] = useState(false); // <-- NEW STATE

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

          <DropdownMenuItem onClick={() => setOpenExtend(true)}>
            {" "}
            {/* <-- ADDED */}
            <Clock className="mr-2 h-4 w-4" /> Extend Time
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
        existingProblems={contest.problems}
        open={openProblems}
        onOpenChange={setOpenProblems}
      />
      <ExtendContestDialog // <-- NEW DIALOG
        contestId={contest.id}
        contestName={contest.name}
        open={openExtend}
        onOpenChange={setOpenExtend}
      />
    </>
  );
}
