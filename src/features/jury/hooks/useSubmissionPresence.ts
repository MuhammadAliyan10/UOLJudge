"use client";

import { useEffect, useState, useRef } from "react";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";

export interface UseSubmissionPresenceReturn {
    otherViewers: string[];
    isLoading: boolean;
}

/**
 * 🎯 Google Docs-style Presence System Hook
 * 
 * Manages real-time presence tracking for a submission.
 * Automatically announces entry/exit and tracks other jury members viewing the same submission.
 * 
 * @param submissionId - The submission being viewed
 * @param myName - Current jury member's name
 * @returns otherViewers - List of other juries currently viewing (excludes self)
 */
export function useSubmissionPresence(
    submissionId: string,
    myName: string
): UseSubmissionPresenceReturn {
    const [otherViewers, setOtherViewers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const hasSentEnterRef = useRef(false);
    const submissionIdRef = useRef(submissionId);
    const myNameRef = useRef(myName);

    // Update refs when props change
    useEffect(() => {
        submissionIdRef.current = submissionId;
        myNameRef.current = myName;
    }, [submissionId, myName]);

    const { isConnected, sendMessage } = useContestSocket({
        onPresenceUpdate: (payload) => {
            // Only process updates for this submission
            if (payload.submissionId === submissionId) {
                // Filter out self from the list
                const others = payload.activeUsers.filter((name) => name !== myName);
                setOtherViewers(others);
                setIsLoading(false);
            }
        },
    });

    useEffect(() => {
        if (!isConnected || !submissionId || !myName) return;

        // Send ENTER_SUBMISSION when connected
        if (!hasSentEnterRef.current) {
            console.log(`👁️  Sending ENTER for ${submissionId} as ${myName}`);
            sendMessage("ENTER_SUBMISSION", { submissionId, juryName: myName });
            hasSentEnterRef.current = true;
        }

        // Send LEAVE_SUBMISSION on unmount or when dependencies change
        return () => {
            if (hasSentEnterRef.current) {
                console.log(`👁️  Sending LEAVE for ${submissionIdRef.current} as ${myNameRef.current}`);
                sendMessage("LEAVE_SUBMISSION", {
                    submissionId: submissionIdRef.current,
                    juryName: myNameRef.current
                });
                hasSentEnterRef.current = false;
            }
        };
    }, [isConnected, submissionId, myName, sendMessage]);

    return {
        otherViewers,
        isLoading,
    };
}
