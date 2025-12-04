"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import ContestHeader from "@/features/contest/components/ContestHeader";
import ContestNotStarted from "@/features/contest/components/ContestNotStarted";
import ContestEnded from "@/features/contest/components/ContestEnded";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { BlockedOverlay } from "@/features/contest/components/BlockedOverlay";
import { AlertTriangle, Megaphone } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/shared/ui/alert-dialog";

interface ContestLayoutClientProps {
  teamName: string;
  teamId: string; // Added teamId
  initialScore?: number;
  initialRank?: number; // Added optional teamRank
  contestEndTime?: Date;
  contestStartTime?: Date;
  teamCategory: Category;
  contestId?: string;
  isPaused?: boolean;
  isFrozen?: boolean;
  isBlocked?: boolean; // NEW: Team blocked status
  children: React.ReactNode;
}

export function ContestLayoutClient({
  teamName,
  teamId,
  initialScore = 0,
  initialRank,
  contestEndTime: initialEndTime,
  contestStartTime: initialStartTime,
  teamCategory,
  contestId,
  isPaused: initialPaused = false,
  isFrozen: initialFrozen = false,
  isBlocked: initialBlocked = false, // NEW: Blocked status
  children,
}: ContestLayoutClientProps) {
  const router = useRouter();

  // State
  const [contestStatus, setContestStatus] = useState<"PRE_START" | "ACTIVE" | "ENDED">("ACTIVE");
  const [isBlocked, setIsBlocked] = useState(initialBlocked); // NEW: State for blocked status
  const [isPaused, setIsPaused] = useState(initialPaused);
  const [isFrozen, setIsFrozen] = useState(initialFrozen);
  const [endTime, setEndTime] = useState<Date | undefined>(initialEndTime);
  const [startTime, setStartTime] = useState<Date | undefined>(initialStartTime);

  // Announcement modal state
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");

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
    onTeamStatusUpdate: (payload) => {
      if (payload.teamId === teamId) {
        console.log("🚫 Team Blocked Status Update:", payload);
        setIsBlocked(payload.isBlocked);
        if (payload.isBlocked) {
          router.refresh(); // Force server re-check to be safe
        }
      }
    },
    onAnnouncement: (payload) => {
      console.log("📢 Admin Announcement Received:", payload);
      if (payload.message) {
        setAnnouncementMessage(payload.message);
        setAnnouncementOpen(true);
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
        teamId={teamId}
        initialScore={initialScore}
        initialRank={initialRank}
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

      {/* Blocked Overlay - Full Screen Disqualification */}
      {isBlocked && <BlockedOverlay />}

      {/* Announcement Modal - Persistent until dismissed */}
      <AlertDialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <AlertDialogContent className="bg-white max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Megaphone className="h-6 w-6 text-blue-600" />
              Admin Announcement
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-700 pt-2">
              {announcementMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAnnouncementOpen(false)}>
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
