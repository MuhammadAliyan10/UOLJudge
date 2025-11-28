"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/server/actions/auth";
import {
  LogOut,
  Cpu,
  Globe,
  Smartphone,
  CheckCircle2,
  XCircle,
  Circle,
  Menu,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Category, SubmissionStatus } from "@prisma/client";
import { ContestTimer } from "@/components/contest/ContestTimer";
import { PausedOverlay } from "@/components/contest/PausedOverlay";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ProblemSummary {
  id: string;
  title: string;
  orderIndex: number;
}

interface ContestLayoutClientProps {
  teamName: string;
  teamScore: number;
  teamCategory: Category;
  contestId: string;
  contestName: string;
  contestEndTime: Date;
  isPaused: boolean;
  pausedAt: Date | null;
  problems: ProblemSummary[];
  submissionStatusMap: Record<string, SubmissionStatus>;
  children: React.ReactNode;
}

export function ContestLayoutClient({
  teamName,
  teamScore,
  teamCategory,
  contestId,
  contestName,
  contestEndTime,
  isPaused,
  pausedAt,
  problems,
  submissionStatusMap,
  children,
}: ContestLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    toast.loading("Signing out...");
    await logoutAction();
  };

  const CategoryIcon =
    teamCategory === "WEB"
      ? Globe
      : teamCategory === "ANDROID"
        ? Smartphone
        : Cpu;

  const getStatusIcon = (problemId: string) => {
    const status = submissionStatusMap[problemId];
    if (status === "ACCEPTED") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "REJECTED") return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === "PENDING") return <Circle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    return <Circle className="h-4 w-4 text-slate-300" />;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <CategoryIcon className="h-5 w-5 text-slate-500" />
          <span className="font-bold text-slate-900 tracking-tight">
            {teamCategory} TRACK
          </span>
        </div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
          {problems.length} Problems
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {problems.map((problem, index) => {
            const isActive = pathname.includes(`/problems/${problem.id}`);
            return (
              <li key={problem.id}>
                <Link
                  href={`/contest/${contestId}/problems/${problem.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium transition-colors border border-transparent",
                    isActive
                      ? "bg-slate-100 text-slate-900 border-slate-200 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-mono text-xs w-6 h-6 flex items-center justify-center rounded border",
                      isActive ? "bg-white border-slate-300" : "bg-slate-50 border-slate-200"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="truncate max-w-[140px]">
                      {problem.title}
                    </span>
                  </div>
                  {getStatusIcon(problem.id)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Current Score
          </span>
          <span className="font-mono font-bold text-xl text-slate-900">
            {teamScore}
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Paused Overlay */}
      {isPaused && <PausedOverlay pausedAt={pausedAt} />}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Left: Mobile Menu & Team Name */}
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">UJ</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-slate-200" />
              <div className="font-bold text-slate-900 truncate max-w-[200px]">
                {teamName}
              </div>
            </div>
          </div>

          {/* Center: Contest Name (Hidden on small screens) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contest
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {contestName}
            </span>
          </div>

          {/* Right: Timer */}
          <div>
            <ContestTimer
              initialEndTime={contestEndTime}
              initialPauseState={isPaused}
              contestId={contestId}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 bg-white border-r border-slate-200 overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
