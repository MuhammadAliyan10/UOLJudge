// src/components/admin/ExtendContestDialog.tsx
"use client";

import { useState } from "react";
import { extendContestTime } from "@/server/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Clock, Calendar } from "lucide-react";

interface ExtendContestDialogProps {
  contestId: string;
  contestName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendContestDialog({
  contestId,
  contestName,
  open,
  onOpenChange,
}: ExtendContestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState(15); // Default 15 mins extension

  const handleExtend = async () => {
    if (minutes <= 0) {
      toast.error("Extension must be at least 1 minute.");
      return;
    }

    setLoading(true);

    const res = await extendContestTime(contestId, minutes);

    if (res.success) {
      if (res.newTime) {
        const newTime = new Date(res.newTime).toLocaleTimeString();
        toast.success(`Contest extended! New end time: ${newTime}`);
      } else {
        toast.success("Contest extended!");
      }
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>Extend Contest: {contestName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            Warning: This action updates the live end time for all participants.
          </p>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Clock size={16} /> Minutes to Add
            </Label>
            <Input
              type="number"
              min={1}
              max={120} // Cap at 2 hours maximum extension at a time
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              required
            />
          </div>

          <Button
            onClick={handleExtend}
            disabled={loading || minutes < 1}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Extend by {minutes} Minutes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
