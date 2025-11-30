"use client";

import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * WebSocket Listener for Admin Portal
 * Listens for real-time updates and triggers page revalidation
 */
export function AdminWebSocketListener() {
    const router = useRouter();

    useContestSocket({
        // Team status changes (blocking/unblocking)
        onTeamStatusUpdate: () => {
            router.refresh();
        },
        // New submissions
        onNewSubmission: () => {
            router.refresh();
        },
        // Submission grading updates
        onSubmissionUpdate: () => {
            router.refresh();
        },
        // Leaderboard changes
        onLeaderboardUpdate: () => {
            router.refresh();
        },
        // Contest status changes (pause/resume)
        onStatusUpdate: () => {
            router.refresh();
        },
        // Jury queue updates
        onJuryQueueUpdate: () => {
            router.refresh();
        },
    });

    return null; // This is a listener-only component
}
