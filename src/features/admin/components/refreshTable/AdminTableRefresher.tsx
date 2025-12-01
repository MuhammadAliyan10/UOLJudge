// src/components/admin/AdminTableRefresher.tsx
"use client";

import { useEffect } from "react";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";

interface RefresherProps {
  children: React.ReactNode;
  interval: number; // e.g., 15000ms (15 seconds)
}

/**
 * Forces the parent Server Component route to refresh its data (refetch)
 * on a set interval. This ensures administrative tables stay current.
 * Uses debounced refresh to prevent server thrashing.
 */
export default function AdminTableRefresher({
  children,
  interval,
}: RefresherProps) {
  const refresh = useDebouncedRefresh(500);

  useEffect(() => {
    // Use debounced refresh to prevent server thrashing
    const timer = setInterval(() => {
      refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [refresh, interval]);

  return <>{children}</>;
}
