// src/components/admin/ContestTableRefresher.tsx
"use client";

import { useEffect } from "react";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";

interface RefresherProps {
  children: React.ReactNode;
  interval: number; // 15000ms for 15 seconds
}

/**
 * Forces the parent Server Component data to re-fetch (refetch)
 * on a set interval via debounced refresh.
 * ALSO listens to WebSocket events for instant updates.
 */
export default function ContestTableRefresher({
  children,
  interval,
}: RefresherProps) {
  const refresh = useDebouncedRefresh(500);

  // 1. Interval Refresh (Backup)
  useEffect(() => {
    const timer = setInterval(() => {
      refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [refresh, interval]);

  // 2. Real-time Socket Refresh
  useContestSocket({
    onContestUpdate: (payload) => {
      refresh();
    },
    onStatusUpdate: () => refresh(),
  });

  return <>{children}</>;
}
