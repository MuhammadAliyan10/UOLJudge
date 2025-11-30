"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";

export function JuryWebSocketListener() {
    const router = useRouter();

    useContestSocket({
        onNewSubmission: () => {
            router.refresh();
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
