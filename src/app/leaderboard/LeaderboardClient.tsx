"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { WifiOff, Cpu, Globe, Smartphone, Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Team {
  id: string;
  display_name: string;
  username: string;
  category: Category;
  total_score: number;
  solved_indexes: number[];
}

interface LeaderboardClientProps {
  teams: Team[];
  contestName: string;
  contestEndTime?: Date;
  isFrozen: boolean;
  category?: Category; // If present, view is locked
}

export function LeaderboardClient({
  teams,
  contestName,
  contestEndTime,
  isFrozen,
  category,
}: LeaderboardClientProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState("--:--:--");

  const getLetter = (idx: number) => String.fromCharCode(65 + idx);

  // Category Icon Map
  const CategoryIcon =
    category === "WEB" ? Globe : category === "ANDROID" ? Smartphone : Cpu;

  // Real-time updates via Server-Sent Events
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Instant refresh on score updates
        if (data.event === 'SCORE_UPDATE') {
          console.log('[Leaderboard] Score updated - refreshing...');
          router.refresh();
        }
      } catch (error) {
        console.error('[Leaderboard] Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('[Leaderboard] SSE connection error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [router]);

  // Countdown timer (no polling - SSE handles updates)
  useEffect(() => {
    if (!contestEndTime) return;

    const tick = () => {
      const now = new Date();
      const end = new Date(contestEndTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [contestEndTime]);

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-6 p-6">
      {/* 1. HEADER */}
      <Card className="bg-slate-900 border-slate-800 shadow-md overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              {category ? (
                <CategoryIcon className="text-white h-7 w-7" />
              ) : (
                <Trophy className="text-white h-7 w-7" />
              )}
            </div>

            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                {category ? `${category} Standings` : contestName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {isFrozen ? (
                  <Badge
                    variant="destructive"
                    className="font-mono uppercase tracking-wider px-3"
                  >
                    <WifiOff size={12} className="mr-1.5" /> Frozen
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-none font-mono uppercase tracking-wider gap-2 px-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Live
                  </Badge>
                )}
                {!category && <span className="text-slate-500 text-sm">|</span>}
                {!category && (
                  <span className="text-slate-400 text-sm font-medium">
                    All Categories
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right bg-slate-800/50 px-6 py-3 rounded-lg border border-slate-700/50">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Time Remaining
            </div>
            <div className="font-mono font-bold text-4xl text-white tracking-widest tabular-nums">
              {timeRemaining}
            </div>
          </div>
        </div>

        {/* Category Color Line */}
        <div
          className={cn(
            "h-1.5 w-full",
            category === "CORE"
              ? "bg-purple-500"
              : category === "WEB"
                ? "bg-sky-500"
                : category === "ANDROID"
                  ? "bg-emerald-500"
                  : "bg-slate-700"
          )}
        />
      </Card>

      {/* 2. TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-b border-slate-200">
              <TableHead className="w-24 text-center h-14 text-slate-500 font-bold uppercase tracking-wider text-sm">
                Rank
              </TableHead>
              <TableHead className="h-14 text-slate-500 font-bold uppercase tracking-wider text-sm">
                Team
              </TableHead>
              <TableHead className="h-14 text-slate-500 font-bold uppercase tracking-wider text-sm">
                Solved Problems
              </TableHead>
              <TableHead className="w-40 text-right h-14 text-slate-500 font-bold uppercase tracking-wider text-sm">
                Score
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <p className="text-xl text-slate-400 font-light">
                    {category
                      ? `No ${category} teams have submitted yet.`
                      : "Waiting for submissions..."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                return (
                  <TableRow
                    key={team.id}
                    className={cn(
                      "group border-b border-slate-100 transition-colors h-20",
                      rank % 2 === 0 ? "bg-slate-50/40" : "bg-white"
                    )}
                  >
                    <TableCell className="text-center">
                      <div
                        className={cn(
                          "mx-auto flex items-center justify-center w-10 h-10 rounded-lg text-xl font-black",
                          rank === 1
                            ? "bg-yellow-100 text-yellow-700"
                            : rank === 2
                              ? "bg-slate-200 text-slate-700"
                              : rank === 3
                                ? "bg-orange-100 text-orange-800"
                                : "text-slate-400"
                        )}
                      >
                        {rank}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col justify-center">
                        <span
                          className={cn(
                            "font-bold leading-tight tracking-tight",
                            isTop3
                              ? "text-2xl text-slate-900"
                              : "text-xl text-slate-700"
                          )}
                        >
                          {team.display_name}
                        </span>
                        <span className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
                          @{team.username}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {team.solved_indexes.length > 0 ? (
                          team.solved_indexes
                            .sort((a, b) => a - b)
                            .map((idx) => (
                              <Badge
                                key={idx}
                                className="h-9 w-9 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold shadow-sm border-0"
                              >
                                {getLetter(idx)}
                              </Badge>
                            ))
                        ) : (
                          <span className="text-slate-300 text-2xl font-light pl-2">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-black tracking-tighter tabular-nums",
                          rank === 1
                            ? "text-4xl text-emerald-600"
                            : "text-3xl text-slate-800"
                        )}
                      >
                        {team.total_score}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
