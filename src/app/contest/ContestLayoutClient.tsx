"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Ensure useRouter is imported
import { logoutAction } from "@/server/actions/auth";
import {
  Trophy,
  LogOut,
  FileCode,
  ListTodo,
  History,
  Cpu,
  Globe,
  Smartphone,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Category } from "@prisma/client";

interface ContestLayoutClientProps {
  teamName: string;
  teamScore: number;
  contestEndTime?: Date;
  teamCategory: Category;
  contestId?: string;
  children: React.ReactNode;
}

export function ContestLayoutClient({
  teamName,
  teamScore,
  contestEndTime,
  teamCategory,
  contestId,
  children,
}: ContestLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter(); // Ensure router is initialized
  const [timeRemaining, setTimeRemaining] = useState("--:--:--");
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  // Dynamic Navigation
  const navigation = [
    {
      name: "Problems",
      href: contestId ? `/contest/${contestId}/problems` : "/contest",
      icon: FileCode,
    },
    {
      name: "My Submissions",
      href: contestId ? `/contest/${contestId}/submissions` : "/contest",
      icon: History,
    },
    {
      name: "Leaderboard",
      href: contestId ? `/leaderboard/${contestId}` : "/leaderboard",
      icon: ListTodo,
    },
  ];

  const CategoryIcon =
    teamCategory === "WEB"
      ? Globe
      : teamCategory === "ANDROID"
        ? Smartphone
        : Cpu;

  // ---------------------------------------------------
  // A. TIMER LOGIC (1-second update)
  // ---------------------------------------------------
  useEffect(() => {
    if (!contestEndTime) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(contestEndTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        setIsEndingSoon(false);
        // CRITICAL: Force a final refresh if contest ends to apply time-lock immediately
        if (!isEndingSoon) router.refresh();
        return;
      }

      if (diff < 5 * 60 * 1000) setIsEndingSoon(true);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contestEndTime, router, isEndingSoon]);

  // ---------------------------------------------------
  // B. REAL-TIME SSE UPDATES (Instant admin changes)
  // ---------------------------------------------------
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[Contest ${timestamp}] Connecting to SSE at /api/events`);
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`%c[Contest ${timestamp}] ✅ SSE CONNECTED`, 'color: green; font-weight: bold');
        };

        eventSource.onmessage = (event) => {
          const timestamp = new Date().toLocaleTimeString();
          try {
            const data = JSON.parse(event.data);
            console.log(`%c[Contest ${timestamp}] 📨 SSE Message:`, 'color: blue; font-weight: bold', data);

            // Instant refresh on contest/problem updates
            if (data.event === 'CONTEST_UPDATE') {
              console.log(`%c[Contest ${timestamp}] 🔄 CONTEST UPDATE - Refreshing page...`, 'color: orange; font-weight: bold');
              router.refresh();
            }

            if (data.event === 'SCORE_UPDATE') {
              console.log(`%c[Contest ${timestamp}] 🔄 SCORE UPDATE - Refreshing page...`, 'color: purple; font-weight: bold');
              router.refresh();
            }
          } catch (error) {
            console.error(`[Contest ${timestamp}] ❌ Failed to parse SSE message:`, error);
          }
        };

        eventSource.onerror = (error) => {
          const timestamp = new Date().toLocaleTimeString();
          console.error(`%c[Contest ${timestamp}] ❌ SSE ERROR:`, 'color: red; font-weight: bold', error);
          eventSource?.close();

          // Auto-reconnect after 3 seconds
          console.log(`[Contest ${timestamp}] ⏳ Reconnecting in 3 seconds...`);
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (error) {
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[Contest ${timestamp}] ❌ Failed to create SSE:`, error);
        // Retry connection
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    // Initial connection
    connect();

    return () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[Contest ${timestamp}] 🧹 Cleaning up SSE connection`);
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [router]);

  const handleLogout = async () => {
    toast.loading("Signing out...");
    await logoutAction();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-md">
                <span className="text-white font-bold text-sm">UJ</span>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-slate-900 leading-tight">
                  UOLJudge
                </h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Contest Portal
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.name === "Leaderboard" &&
                    pathname.startsWith("/leaderboard"));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    target={item.name === "Leaderboard" ? "_blank" : undefined}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-slate-100 text-blue-700 shadow-inner"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      size={16}
                      className={isActive ? "text-blue-600" : "text-slate-400"}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Stats */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Score Badge (HIDDEN/NEUTRAL) */}
              <div className="flex flex-col items-end md:items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Status
                </span>
                <div className="flex items-center gap-1.5 font-bold text-slate-600">
                  <Shield size={14} />
                  <span className="text-sm leading-none">In Play</span>
                </div>
              </div>

              {/* Timer Badge */}
              {contestEndTime && (
                <div
                  className={cn(
                    "hidden sm:flex flex-col items-end px-3 py-1 rounded-md border transition-colors",
                    isEndingSoon
                      ? "bg-red-50 border-red-100 animate-pulse"
                      : "bg-slate-50 border-slate-100"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider",
                      isEndingSoon ? "text-red-500" : "text-slate-400"
                    )}
                  >
                    Time Left
                  </span>
                  <div
                    className={cn(
                      "font-mono font-bold text-lg leading-none",
                      isEndingSoon ? "text-red-600" : "text-slate-700"
                    )}
                  >
                    {timeRemaining}
                  </div>
                </div>
              )}

              <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* User Profile */}
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {teamName}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <CategoryIcon size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      {teamCategory}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
