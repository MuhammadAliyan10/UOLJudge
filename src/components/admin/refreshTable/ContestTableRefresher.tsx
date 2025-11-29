// src/components/admin/ContestTableRefresher.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useContestSocket } from "@/hooks/useContestSocket";

interface RefresherProps {
  children: React.ReactNode;
  interval: number; // 15000ms for 15 seconds
}

/**
 * Forces the parent Server Component data to re-fetch (refetch)
 * on a set interval via router.refresh().
 * ALSO listens to WebSocket events for instant updates.
 */
export default function ContestTableRefresher({
  children,
  interval,
}: RefresherProps) {
  const router = useRouter();

  // 1. Interval Refresh (Backup)
  useEffect(() => {
    const timer = setInterval(() => {
      // Forces the Next.js cache to be checked/re-run for the current path
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  // 2. Real-time Socket Refresh
  useContestSocket({
    onContestUpdate: (payload) => {
      console.log("🔄 Admin Table Refresh Triggered:", payload);
      router.refresh();
    },
    onStatusUpdate: () => router.refresh(),
  });

  return <>{children}</>;
}
