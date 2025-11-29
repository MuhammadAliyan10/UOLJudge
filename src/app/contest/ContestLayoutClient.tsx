"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import ContestHeader from "./components/ContestHeader";
import ContestNotStarted from "./components/ContestNotStarted";
import ContestEnded from "./components/ContestEnded";
import { useContestSocket } from "@/hooks/useContestSocket";
import { AlertTriangle } from "lucide-react";

interface ContestLayoutClientProps {
  teamName: string;
  teamScore: number;
  contestEndTime?: Date;
  contestStartTime?: Date;
  teamCategory: Category;
  contestId?: string;
  isPaused?: boolean;
  isFrozen?: boolean;
  children: React.ReactNode;
}

export function ContestLayoutClient({
  teamName,
  teamScore,
  contestEndTime: initialEndTime,
  contestStartTime: initialStartTime,
  teamCategory,
  contestId,
  isPaused: initialPaused = false,
  isFrozen: initialFrozen = false,
  children,
}: ContestLayoutClientProps) {
  const router = useRouter();

  // State
  const [contestStatus, setContestStatus] = useState<"PRE_START" | "ACTIVE" | "ENDED">("ACTIVE");
  const [isPaused, setIsPaused] = useState(initialPaused);
  const [isFrozen, setIsFrozen] = useState(initialFrozen);
  const [endTime, setEndTime] = useState<Date | undefined>(initialEndTime);
  const [startTime, setStartTime] = useState<Date | undefined>(initialStartTime);

  // ---------------------------------------------------
  // A. CONTEST STATUS LOGIC (Local Timer)
  // ---------------------------------------------------
  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      if (startTime && now < new Date(startTime)) {
        setContestStatus("PRE_START");
      } else if (endTime && now > new Date(endTime)) {
        setContestStatus("ENDED");
      } else {
        setContestStatus("ACTIVE");
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  // ---------------------------------------------------
  // B. REAL-TIME SOCKET UPDATES
  // ---------------------------------------------------
  useContestSocket({
    onStatusUpdate: (payload) => {
      if (payload.contestId === contestId) {
        console.log("🔄 Contest Status Update:", payload);
        if (payload.isPaused !== undefined) setIsPaused(payload.isPaused);
        if (payload.isFrozen !== undefined) setIsFrozen(payload.isFrozen);
        if (payload.endTime) setEndTime(new Date(payload.endTime));
        if (payload.startTime) setStartTime(new Date(payload.startTime));
        router.refresh();
      }
    },
    onTimeUpdate: (payload) => {
      if (payload.endTime) {
        setEndTime(new Date(payload.endTime));
        router.refresh();
      }
    },
    onContestUpdate: (payload) => {
      console.log("🔄 Contest Update:", payload);
      if (payload.contestId === contestId || !contestId) {
        router.refresh();
      }
    },
    onConnect: () => console.log("✅ Connected to Contest Socket"),
    onDisconnect: () => console.log("❌ Disconnected from Contest Socket"),
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header is always visible unless pre-start (optional, but usually good to keep) */}
      <ContestHeader
        teamName={teamName}
        teamScore={teamScore}
        teamCategory={teamCategory}
        contestEndTime={endTime}
        contestStartTime={startTime}
        isPaused={isPaused}
        contestId={contestId}
      />

      {/* Frozen Banner */}
      {isFrozen && contestStatus === "ACTIVE" && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top-full">
          <AlertTriangle size={16} className="text-blue-200" />
          <span>❄️ The scoreboard is FROZEN! Submissions are still accepted but ranks are hidden.</span>
        </div>
      )}

      {/* Paused Banner */}
      {isPaused && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top-full">
          <AlertTriangle size={16} className="text-amber-100" />
          <span>⚠️ The contest is currently PAUSED. Submissions are temporarily disabled.</span>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {contestStatus === "PRE_START" ? (
            <ContestNotStarted
              contestName="UOL Coding Contest"
              startTime={startTime}
              contestId={contestId}
            />
          ) : contestStatus === "ENDED" ? (
            <ContestEnded contestId={contestId} />
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
