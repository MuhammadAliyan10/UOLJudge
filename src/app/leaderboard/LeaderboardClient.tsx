"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import {
  WifiOff,
  Cpu,
  Globe,
  Smartphone,
  Trophy,
  Medal,
  Activity
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/shared/ui/table";
import { Badge } from "@/features/shared/ui/badge";
import { Card } from "@/features/shared/ui/card";

// --- ANIMATED DIGIT COMPONENT ---
// This component handles the "sliding" animation
const TickerDigit = ({ value }: { value: string }) => {
  const num = parseInt(value);

  return (
    <div className="h-16 md:h-20 w-10 md:w-14 overflow-hidden relative">
      <div
        className="absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${num * 10}%)` }} // Slides to the correct number
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div
            key={n}
            className="h-16 md:h-20 flex items-center justify-center font-mono text-5xl md:text-7xl font-black text-slate-900 dark:text-white"
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- SEPARATOR COMPONENT ---
const TickerSeparator = () => (
  <div className="h-16 md:h-20 flex items-center justify-center pb-2">
    <span className="text-3xl md:text-5xl font-black text-slate-300 animate-pulse">:</span>
  </div>
);

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
  category?: Category;
}

export function LeaderboardClient({
  teams: initialTeams,
  contestName,
  contestEndTime,
  isFrozen,
  category,
}: LeaderboardClientProps) {
  const router = useRouter();

  // State for teams data - initialize with server data
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  // State for individual digits to drive the ticker
  const [timeDigits, setTimeDigits] = useState({
    h1: "0", h2: "0",
    m1: "0", m2: "0",
    s1: "0", s2: "0"
  });

  const getLetter = (idx: number) => String.fromCharCode(65 + idx);
  const CategoryIcon = category === "WEB" ? Globe : category === "ANDROID" ? Smartphone : Cpu;

  // Real-time updates via WebSocket - update state directly
  useContestSocket({
    onLeaderboardUpdate: (payload) => {
      // Refresh from server to get updated data
      router.refresh();
    },
    onSubmissionUpdate: () => {
      // Refresh from server to get updated scores
      router.refresh();
    },
  });

  // Update teams when initialTeams prop changes (from router.refresh())
  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  // Timer Logic
  useEffect(() => {
    if (!contestEndTime) return;
    const tick = () => {
      const now = new Date();
      const end = new Date(contestEndTime);
      const diff = Math.max(0, end.getTime() - now.getTime());

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      // Pad and split into digits
      const hStr = h.toString().padStart(2, "0");
      const mStr = m.toString().padStart(2, "0");
      const sStr = s.toString().padStart(2, "0");

      setTimeDigits({
        h1: hStr[0], h2: hStr[1],
        m1: mStr[0], m2: mStr[1],
        s1: sStr[0], s2: sStr[1]
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [contestEndTime]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 p-4 md:p-8">

      {/* 1. HEADER (Transparent, No BG) */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 mb-8">

        {/* Left: Title Area */}
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left gap-4">
          <div className="flex items-center gap-4">
            {category && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <CategoryIcon className="h-8 w-8 text-slate-900 dark:text-white" />
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                {category ? category : contestName}
              </h1>
              {category && <span className="text-lg font-bold text-slate-400 tracking-widest uppercase">Leaderboard</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFrozen ? (
              <Badge variant="destructive" className="px-3 py-1 text-sm font-bold uppercase tracking-widest">
                <WifiOff className="w-3 h-3 mr-2" /> Frozen
              </Badge>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live Feed
              </div>
            )}
          </div>
        </div>

        {/* Right: THE ANIMATED TICKER (No BG, Huge Text) */}
        <div className="flex flex-col items-center xl:items-end">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Time Remaining</span>

          {/* Ticker Container */}
          <div className="flex items-center gap-0.5 md:gap-1">
            <TickerDigit value={timeDigits.h1} />
            <TickerDigit value={timeDigits.h2} />
            <TickerSeparator />
            <TickerDigit value={timeDigits.m1} />
            <TickerDigit value={timeDigits.m2} />
            <TickerSeparator />
            <TickerDigit value={timeDigits.s1} />
            <TickerDigit value={timeDigits.s2} />
          </div>
        </div>
      </div>

      {/* 2. TABLE */}
      <Card className="border-0 shadow-lg ring-1 ring-slate-900/5 overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24 text-center h-14 text-slate-400 font-extrabold uppercase text-xs tracking-widest">Rank</TableHead>
              <TableHead className="h-14 text-slate-400 font-extrabold uppercase text-xs tracking-widest">Team</TableHead>
              <TableHead className="h-14 text-slate-400 font-extrabold uppercase text-xs tracking-widest">Progress</TableHead>
              <TableHead className="w-40 text-right h-14 text-slate-400 font-extrabold uppercase text-xs tracking-widest pr-8">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-300 gap-4">
                    <Trophy className="h-12 w-12 opacity-20" />
                    <p className="text-lg font-medium text-slate-400">Waiting for submissions...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team, index) => {
                const rank = index + 1;

                return (
                  <TableRow
                    key={team.id}
                    className={cn(
                      "h-20 transition-all border-b border-slate-100 dark:border-slate-800 last:border-0",
                      rank === 1 ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    )}
                  >
                    {/* Rank */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {rank === 1 ? <Medal className="h-8 w-8 text-amber-400 drop-shadow-sm" /> :
                          rank === 2 ? <Medal className="h-7 w-7 text-slate-400" /> :
                            rank === 3 ? <Medal className="h-6 w-6 text-amber-700" /> :
                              <span className="text-lg font-bold text-slate-400">#{rank}</span>}
                      </div>
                    </TableCell>

                    {/* Team */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-bold text-lg leading-none mb-1",
                          rank === 1 ? "text-amber-900" : "text-slate-700 dark:text-slate-200"
                        )}>
                          {team.display_name}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          @{team.username}
                        </span>
                      </div>
                    </TableCell>

                    {/* Progress Badges */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {team.solved_indexes.length > 0 ? (
                          team.solved_indexes.sort((a, b) => a - b).map((idx) => (
                            <Badge
                              key={idx}
                              className="h-9 w-9 p-0 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm border-0 rounded-md"
                            >
                              {getLetter(idx)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-200 text-2xl font-thin select-none">-</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Score */}
                    <TableCell className="text-right pr-8">
                      <span className={cn(
                        "text-3xl font-black tabular-nums tracking-tight",
                        rank === 1 ? "text-emerald-600" : "text-slate-800 dark:text-white"
                      )}>
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