import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Debounced Router Refresh Hook
 *
 * Prevents server thrashing during high-load scenarios by debouncing
 * router.refresh() calls. Multiple rapid calls within the debounce window
 * will only trigger a single refresh after the cooldown period.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 2000ms)
 * @returns refresh function that triggers debounced router.refresh()
 *
 * @example
 * const refresh = useDebouncedRefresh(500);
 *
 * useContestSocket({
 *   onLeaderboardUpdate: () => refresh(), // Won't spam during bulk updates
 * });
 */
export function useDebouncedRefresh(debounceMs: number = 2000) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  // CLEANUP FIX: Clear pending timeout on unmount to prevent memory leaks
  // and React warnings about state updates on unmounted components
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
      router.refresh();
      lastRefreshRef.current = now;
    } else {
      // Otherwise, schedule a refresh after the remaining debounce time
      const remainingTime = debounceMs - timeSinceLastRefresh;

      timeoutRef.current = setTimeout(() => {
        router.refresh();
        lastRefreshRef.current = Date.now();
      }, remainingTime);
    }
  }, [router, debounceMs]);

  return refresh;
}
