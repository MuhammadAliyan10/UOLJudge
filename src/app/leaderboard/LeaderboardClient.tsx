"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { useDebouncedRefresh } from "@/hooks/useDebouncedRefresh";
import { Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/shared/ui/table";
import { Badge } from "@/features/shared/ui/badge";

// Helper to convert problem index to letter (0 -> A, 1 -> B, etc)
const getLetter = (index: number) => String.fromCharCode(65 + index);

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
  contestStartTime?: Date;
  contestEndTime?: Date;
  isFrozen: boolean;
  category?: Category;
}

export function LeaderboardClient({
  teams: initialTeams,
  contestName,
  contestStartTime,
  contestEndTime,
  isFrozen,
  category,
}: LeaderboardClientProps) {
  const router = useRouter();
  const refresh = useDebouncedRefresh(2000);

  // State
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [frozen, setFrozen] = useState(isFrozen);

  // Time state
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // WebSocket handlers
  useContestSocket({
    onLeaderboardUpdate: () => refresh(),
    onSubmissionUpdate: () => refresh(),
    onStatusUpdate: (payload) => {
      if (payload.isFrozen !== undefined) {
        setFrozen(payload.isFrozen);
      }
      if (payload.endTime) {
        const endTime = new Date(payload.endTime);
        const now = new Date();
        if (endTime <= now) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      }
      refresh();
    },
  });

  // Sync props with state
  useEffect(() => setTeams(initialTeams), [initialTeams]);
  useEffect(() => setFrozen(isFrozen), [isFrozen]);

  // Contest state detection
  const now = new Date();
  const isUpcoming = contestStartTime
    ? now < new Date(contestStartTime)
    : false;

  // Countdown timer
  useEffect(() => {
    const targetDate = isUpcoming ? contestStartTime : contestEndTime;
    if (!targetDate) return;

    const tick = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = Math.max(0, target.getTime() - now.getTime());

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [contestStartTime, contestEndTime, isUpcoming]);

  // Format time digits
  const formatDigits = (num: number) => num.toString().padStart(2, "0");
  const [h1, h2] = formatDigits(timeLeft.hours).split("");
  const [m1, m2] = formatDigits(timeLeft.minutes).split("");
  const [s1, s2] = formatDigits(timeLeft.seconds).split("");

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 py-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 mb-10">
        {/* Left: Title + Status Badge */}
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            {contestName}
          </h1>

          {/* Status Badge */}
          {frozen ? (
            <Badge
              variant="outline"
              className="bg-amber-50 border-amber-200 text-amber-700 gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Frozen
            </Badge>
          ) : isUpcoming ? (
            <Badge
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Scheduled
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-green-50 border-green-200 text-green-700 gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          )}
        </div>

        {/* Right: Countdown Timer */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Hours */}
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Hours
            </p>
            <div className="flex gap-1">
              <div className="w-10 h-12 md:w-12 md:h-14 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold text-slate-900">
                {h1}
              </div>
              <div className="w-10 h-12 md:w-12 md:h-14 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold text-slate-900">
                {h2}
              </div>
            </div>
          </div>

          {/* Minutes */}
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Minutes
            </p>
            <div className="flex gap-1">
              <div className="w-10 h-12 md:w-12 md:h-14 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold text-slate-900">
                {m1}
              </div>
              <div className="w-10 h-12 md:w-12 md:h-14 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold text-slate-900">
                {m2}
              </div>
            </div>
          </div>

          {/* Seconds */}
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Seconds
            </p>
            <div className="flex gap-1">
              <div className="w-10 h-12 md:w-12 md:h-14 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold text-slate-900">
                {s1}
              </div>
              <div className="w-10 h-12 md:w-12 md:h-14 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-xl md:text-2xl font-bold text-slate-900">
                {s2}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-200">
              <TableHead className="w-[72px] h-11 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                Rank
              </TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                Team
              </TableHead>
              <TableHead className="h-11 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
                Problems Solved
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Trophy className="h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">
                      Waiting for submissions...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team, index) => {
                const rank = index + 1;

                return (
                  <TableRow
                    key={team.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Rank */}
                    <TableCell className="text-center py-3.5">
                      {rank <= 3 ? (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold text-white",
                            rank === 1 && "bg-amber-500",
                            rank === 2 && "bg-slate-400",
                            rank === 3 && "bg-amber-700"
                          )}
                        >
                          {rank}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-500">
                          {rank}
                        </span>
                      )}
                    </TableCell>

                    {/* Team */}
                    <TableCell className="py-3.5">
                      <div className="text-[15px] font-semibold text-slate-900 leading-tight">
                        {team.display_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        @{team.username}
                      </div>
                    </TableCell>

                    {/* Problems Solved */}
                    <TableCell className="py-3.5">
                      {team.solved_indexes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {team.solved_indexes
                            .sort((a, b) => a - b)
                            .map((idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center justify-center w-7 h-7 bg-emerald-500 text-white text-[11px] font-semibold rounded"
                              >
                                {getLetter(idx)}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
