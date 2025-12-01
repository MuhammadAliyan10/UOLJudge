"use client";

import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";

/**
 * WebSocket Listener for Contest Submissions Page
 * Listens for submission status updates and triggers debounced page refresh
 */
export function SubmissionsWebSocketListener() {
    const refresh = useDebouncedRefresh(500);

    useContestSocket({
        // Listen for submission grading updates
        onSubmissionUpdate: () => {
            refresh();
        },
        // Listen for retry status changes
        onRetryRequested: () => {
            refresh();
        },
        onRetryGranted: () => {
            refresh();
        },
    });

    return null; // Listener-only component
}
