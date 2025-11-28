// src/components/admin/AdminTableRefresher.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RefresherProps {
  children: React.ReactNode;
  interval: number; // e.g., 15000ms (15 seconds)
}

/**
 * Forces the parent Server Component route to refresh its data (refetch)
 * on a set interval. This ensures administrative tables stay current.
 */
export default function AdminTableRefresher({
  children,
  interval,
}: RefresherProps) {
  const router = useRouter();

  useEffect(() => {
    // We use router.refresh() because it forces data fetching logic on the server
    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  return <>{children}</>;
}
