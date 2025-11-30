"use client";

import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { useRouter } from "next/navigation";

/**
 * WebSocket Listener for Contest Submissions Page
 * Listens for submission status updates and triggers page refresh
 */
export function SubmissionsWebSocketListener() {
    const router = useRouter();

    useContestSocket({
        // Listen for submission grading updates
        onSubmissionUpdate: () => {
            router.refresh();
        },
        // Listen for retry status changes
        onRetryRequested: () => {
            router.refresh();
        },
        onRetryGranted: () => {
            router.refresh();
        },
    });

    return null; // Listener-only component
}
