"use client";

import { useState, useEffect } from "react";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";

/**
 * 🎯 Global Presence Tracker for Submissions List
 * 
 * Tracks which submissions are currently being viewed/graded by other juries.
 * Returns a map of submissionId -> array of jury names viewing it.
 */
export function useGlobalSubmissionPresence() {
    const [presenceMap, setPresenceMap] = useState<Map<string, string[]>>(new Map());

    useContestSocket({
        onPresenceUpdate: (payload) => {
            console.log('🎯 PRESENCE_UPDATE received:', payload);
            setPresenceMap((prev) => {
                const newMap = new Map(prev);
                if (payload.activeUsers.length > 0) {
                    newMap.set(payload.submissionId, payload.activeUsers);
                } else {
                    newMap.delete(payload.submissionId);
                }
                console.log('🎯 Updated presenceMap:', Object.fromEntries(newMap));
                return newMap;
            });
        },
    });

    return presenceMap;
}
