import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

/**
 * Debounced Router Refresh Hook
 * 
 * Prevents server thrashing during high-load scenarios by debouncing
 * router.refresh() calls. Multiple rapid calls within the debounce window
 * will only trigger a single refresh after the cooldown period.
 * 
 * @param debounceMs - Debounce delay in milliseconds (default: 500ms)
 * @returns refresh function that triggers debounced router.refresh()
 * 
 * @example
 * const refresh = useDebouncedRefresh(500);
 * 
 * useContestSocket({
 *   onLeaderboardUpdate: () => refresh(), // Won't spam during bulk updates
 * });
 */
export function useDebouncedRefresh(debounceMs: number = 500) {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshRef = useRef<number>(0);

    const refresh = useCallback(() => {
        // Clear any pending refresh
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Calculate time since last refresh
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        // If enough time has passed, refresh immediately
        if (timeSinceLastRefresh >= debounceMs) {
            console.log("[useDebouncedRefresh] Refreshing immediately");
            router.refresh();
            lastRefreshRef.current = now;
        } else {
            // Otherwise, schedule a refresh after the remaining debounce time
            const remainingTime = debounceMs - timeSinceLastRefresh;
            console.log(`[useDebouncedRefresh] Scheduling refresh in ${remainingTime}ms`);

            timeoutRef.current = setTimeout(() => {
                console.log("[useDebouncedRefresh] Executing scheduled refresh");
                router.refresh();
                lastRefreshRef.current = Date.now();
            }, remainingTime);
        }
    }, [router, debounceMs]);

    return refresh;
}
