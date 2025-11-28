// src/components/admin/ContestTableRefresher.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RefresherProps {
  children: React.ReactNode;
  interval: number; // 15000ms for 15 seconds
}

/**
 * Forces the parent Server Component data to re-fetch (refetch)
 * on a set interval via router.refresh().
 */
export default function ContestTableRefresher({
  children,
  interval,
}: RefresherProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      // Forces the Next.js cache to be checked/re-run for the current path
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [router, interval]);

  return <>{children}</>;
}
