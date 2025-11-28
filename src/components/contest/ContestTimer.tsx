"use client";

import { useState, useEffect } from "react";
import { useContestSocket } from "@/hooks/useContestSocket";
import type { ContestStatusPayload } from "@/hooks/useContestSocket";
import { cn } from "@/lib/utils";
import { Clock, Pause } from "lucide-react";

interface ContestTimerProps {
    initialEndTime: Date;
    initialPauseState: boolean;
    contestId: string;
}

export function ContestTimer({
    initialEndTime,
    initialPauseState,
    contestId,
}: ContestTimerProps) {
    const [endTime, setEndTime] = useState(initialEndTime);
    const [isPaused, setIsPaused] = useState(initialPauseState);
    const [timeRemaining, setTimeRemaining] = useState("00:00:00");
    const [millisRemaining, setMillisRemaining] = useState(0);

    // WebSocket integration for real-time contest status updates
    useContestSocket({
        onStatusUpdate: (payload: ContestStatusPayload) => {
            // Only process updates for this contest
            if (payload.contestId !== contestId) return;

            console.log("[ContestTimer] Status update received:", payload);

            // Update pause state
            if (payload.isPaused !== undefined) {
                setIsPaused(payload.isPaused);
            }

            // Update end time if provided
            if (payload.endTime) {
                const newEndTime = new Date(payload.endTime);
                setEndTime(newEndTime);
                console.log("[ContestTimer] End time updated to:", newEndTime);
            }
        },
    });

    // Local tick mechanism - updates every second
    useEffect(() => {
        // Don't tick if paused
        if (isPaused) {
            return;
        }

        const updateTimer = () => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end.getTime() - now.getTime();

            setMillisRemaining(diff);

            if (diff <= 0) {
                setTimeRemaining("00:00:00");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(
                `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            );
        };

        // Initial update
        updateTimer();

        // Set interval for 1-second updates
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [endTime, isPaused]);

    // Determine color based on time remaining
    const getTimerColor = () => {
        if (isPaused) return "text-yellow-600";
        if (millisRemaining <= 0) return "text-slate-400";
        if (millisRemaining < 10 * 60 * 1000) return "text-red-600"; // < 10 minutes
        if (millisRemaining < 30 * 60 * 1000) return "text-orange-600"; // < 30 minutes
        return "text-green-600"; // > 30 minutes
    };

    const getBackgroundColor = () => {
        if (isPaused) return "bg-yellow-50 border-yellow-200";
        if (millisRemaining <= 0) return "bg-slate-50 border-slate-200";
        if (millisRemaining < 10 * 60 * 1000) return "bg-red-50 border-red-200";
        if (millisRemaining < 30 * 60 * 1000) return "bg-orange-50 border-orange-200";
        return "bg-green-50 border-green-200";
    };

    return (
        <div
            className={cn(
                "flex flex-col items-end px-4 py-2 rounded border-2 transition-all duration-300",
                getBackgroundColor()
            )}
        >
            {isPaused ? (
                <>
                    <div className="flex items-center gap-2 mb-1">
                        <Pause className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs uppercase font-bold tracking-wider text-yellow-600">
                            Contest Paused
                        </span>
                    </div>
                    <div className="font-mono font-bold text-2xl text-yellow-600">
                        ⚠️ PAUSED
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                            Time Remaining
                        </span>
                    </div>
                    <div className={cn("font-mono font-bold text-2xl", getTimerColor())}>
                        {timeRemaining}
                    </div>
                </>
            )}
        </div>
    );
}
