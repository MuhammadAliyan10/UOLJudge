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
import { Loader2, Clock, Hourglass, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <DialogContent className="sm:max-w-[420px] p-0 border-slate-200 shadow-xl overflow-hidden rounded-lg ring-1 ring-slate-950/5">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Emergency Override</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Extend Time
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Add duration to <span className="font-semibold text-slate-700">{contestName || "this contest"}</span>.
            Updates immediately for all users.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Select</Label>
            <div className="flex gap-2">
              {[10, 30, 60].map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  size="sm"
                  onClick={() => setMinutes(m)}
                  className={cn(
                    "flex-1 h-9 border-slate-200 font-medium transition-all shadow-sm",
                    minutes === m
                      ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:text-white"
                      : "bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  )}
                >
                  +{m} min
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="minutes" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Custom Duration</Label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-slate-200 bg-slate-50 rounded-l-md text-slate-400 group-focus-within:border-slate-300 group-focus-within:text-slate-600 transition-colors">
                <Hourglass size={16} />
              </div>
              <Input
                id="minutes"
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="pl-12 h-11 text-lg font-mono font-medium border-slate-200 focus:border-slate-300 focus:ring-slate-200 bg-white"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
                MINUTES
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="text-slate-500 hover:text-slate-900">
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={loading || minutes < 1}
            className="bg-slate-900 hover:bg-slate-800 text-white min-w-[140px] shadow-sm font-bold tracking-tight"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2 opacity-70" />}
            Confirm Extension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
