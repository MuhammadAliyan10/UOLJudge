"use client";

import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";

/**
 * WebSocket Listener for Admin Portal
 * Listens for real-time updates and triggers page revalidation
 * Uses debounced refresh to prevent hydration errors and server thrashing
 */
export function AdminWebSocketListener() {
  const refresh = useDebouncedRefresh(300);

  useContestSocket({
    // Team status changes (blocking/unblocking)
    onTeamStatusUpdate: () => {
      refresh();
    },
    // New submissions
    onNewSubmission: () => {
      refresh();
    },
    // Submission grading updates
    onSubmissionUpdate: () => {
      refresh();
    },
    // Leaderboard changes
    onLeaderboardUpdate: () => {
      refresh();
    },
    // Contest status changes (pause/resume)
    onStatusUpdate: () => {
      refresh();
    },
    // Jury queue updates
    onJuryQueueUpdate: () => {
      refresh();
    },
  });

  return null; // This is a listener-only component
}
