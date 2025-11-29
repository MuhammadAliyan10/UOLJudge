"use client";

import { useState, useEffect } from "react";
import { useContestSocket } from "@/hooks/useContestSocket";
import type { ContestStatusPayload } from "@/hooks/useContestSocket";
import { cn } from "@/lib/utils";
import { Clock, Pause } from "lucide-react";

interface ContestTimerProps {
    initialEndTime: Date;
    initialStartTime: Date; // Added
    initialPauseState: boolean;
    contestId: string;
}

export function ContestTimer({
    initialEndTime,
    initialStartTime,
    initialPauseState,
    contestId,
}: ContestTimerProps) {
    const [endTime, setEndTime] = useState(initialEndTime);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [isPaused, setIsPaused] = useState(initialPauseState);
    const [timeRemaining, setTimeRemaining] = useState("00:00:00");
    const [millisRemaining, setMillisRemaining] = useState(0);
    const [status, setStatus] = useState<"PRE_START" | "ACTIVE" | "ENDED">("ACTIVE");

    // WebSocket integration for real-time contest status updates
    useContestSocket({
        onStatusUpdate: (payload: ContestStatusPayload) => {
            if (payload.contestId !== contestId) return;

            if (payload.isPaused !== undefined) setIsPaused(payload.isPaused);
            if (payload.endTime) setEndTime(new Date(payload.endTime));
            if (payload.startTime) setStartTime(new Date(payload.startTime)); // Handle start time updates
        },
    });

    // Local tick mechanism
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const start = new Date(startTime);
            const end = new Date(endTime);

            // Check Status
            if (now < start) {
                setStatus("PRE_START");
                const diff = start.getTime() - now.getTime();
                setMillisRemaining(diff);
                setTimeRemaining(formatTime(diff));
            } else if (now >= start && now < end) {
                setStatus("ACTIVE");
                const diff = end.getTime() - now.getTime();
                setMillisRemaining(diff);
                setTimeRemaining(formatTime(diff));
            } else {
                setStatus("ENDED");
                setMillisRemaining(0);
                setTimeRemaining("00:00:00");
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [endTime, startTime, isPaused]); // Removed isPaused from dependency to allow pre-start tick? No, pre-start should tick.

    const formatTime = (ms: number) => {
        if (ms <= 0) return "00:00:00";
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    // Determine color based on status and time
    const getTimerColor = () => {
        if (status === "PRE_START") return "text-blue-600";
        if (status === "ENDED") return "text-slate-400";
        if (isPaused) return "text-yellow-600";

        if (millisRemaining < 10 * 60 * 1000) return "text-red-600";
        if (millisRemaining < 30 * 60 * 1000) return "text-orange-600";
        return "text-green-600";
    };

    const getBackgroundColor = () => {
        if (status === "PRE_START") return "bg-blue-50 border-blue-200";
        if (status === "ENDED") return "bg-slate-50 border-slate-200";
        if (isPaused) return "bg-yellow-50 border-yellow-200";

        if (millisRemaining < 10 * 60 * 1000) return "bg-red-50 border-red-200";
        if (millisRemaining < 30 * 60 * 1000) return "bg-orange-50 border-orange-200";
        return "bg-green-50 border-green-200";
    };

    const getLabel = () => {
        if (status === "PRE_START") return "Starts In";
        if (status === "ENDED") return "Contest Ended";
        if (isPaused) return "Contest Paused";
        return "Time Remaining";
    };

    return (
        <div
            className={cn(
                "flex flex-col items-end px-4 py-2 rounded border-2 transition-all duration-300 min-w-[140px]",
                getBackgroundColor()
            )}
        >
            <div className="flex items-center gap-2 mb-1">
                {status === "PRE_START" ? (
                    <Clock className="h-4 w-4 text-blue-500" />
                ) : isPaused ? (
                    <Pause className="h-4 w-4 text-yellow-600" />
                ) : (
                    <Clock className="h-4 w-4 text-slate-500" />
                )}
                <span className={cn("text-xs uppercase font-bold tracking-wider",
                    status === "PRE_START" ? "text-blue-500" :
                        isPaused ? "text-yellow-600" : "text-slate-500"
                )}>
                    {getLabel()}
                </span>
            </div>
            <div className={cn("font-mono font-bold text-2xl", getTimerColor())}>
                {isPaused && status === "ACTIVE" ? "⚠️ PAUSED" : timeRemaining}
            </div>
        </div>
    );
}
