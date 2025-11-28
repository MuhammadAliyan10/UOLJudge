"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extendContestTime } from "@/server/actions/contest-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Clock, Calendar, Plus } from "lucide-react";

interface ExtendContestDialogProps {
  contestId: string;
  contestName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendContestDialog({
  contestId,
  contestName,
  open,
  onOpenChange,
}: ExtendContestDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState(10);

  const handleExtend = async () => {
    if (minutes <= 0) {
      toast.error("Extension must be at least 1 minute.");
      return;
    }

    setLoading(true);

    try {
      const res = await extendContestTime(contestId, minutes);

      if (res.success) {
        const newTime = res.newEndTime ? new Date(res.newEndTime).toLocaleTimeString() : "";
        toast.success(`Contest extended by ${minutes} minutes! New end time: ${newTime}`);
        router.refresh();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to extend contest");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-blue-600" />
            Extend Contest{contestName ? `: ${contestName}` : " Time"}
          </DialogTitle>
          <DialogDescription>
            Add extra time to the contest. This will update the timer for all participants immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Quick Add</Label>
            <div className="flex gap-2">
              {[10, 30, 60].map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  size="sm"
                  onClick={() => setMinutes(m)}
                  className={minutes === m ? "border-blue-500 bg-blue-50 text-blue-700" : ""}
                >
                  +{m}m
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minutes">Custom Duration (Minutes)</Label>
            <div className="relative">
              <Input
                id="minutes"
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="pl-10 text-lg font-mono"
              />
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={loading || minutes < 1}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Extend Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
