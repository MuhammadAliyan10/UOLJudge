"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";

export function JuryWebSocketListener() {
    const router = useRouter();

    useContestSocket({
        onNewSubmission: () => {
            // Don't refresh - SubmissionsClient handles this with toast
            // router.refresh() here causes layout re-render and session check issues
        },
        onSubmissionUpdate: () => {
            router.refresh();
        },
        onJuryQueueUpdate: () => {
            router.refresh();
        },
    });

    return null;
}
