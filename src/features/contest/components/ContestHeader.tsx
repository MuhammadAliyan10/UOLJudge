"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Trophy, Cpu, Globe, Smartphone, Shield, FileCode, History, ListTodo, LogOut } from "lucide-react";
import { Category } from "@prisma/client";
import { ContestTimer } from "@/features/contest/components/ContestTimer";
import { cn } from "@/lib/utils";
import { Button } from "@/features/shared/ui/button";
import { logoutAction } from "@/server/actions/auth/auth";
import { toast } from "sonner";

export interface ContestHeaderProps {
    teamName: string;
    teamScore: number;
    teamCategory: Category;
    contestEndTime?: Date;
    contestStartTime?: Date;
    isPaused?: boolean;
    contestId?: string;
}

export default function ContestHeader({
    teamName,
    teamScore,
    teamCategory,
    contestEndTime,
    contestStartTime,
    isPaused,
    contestId,
}: ContestHeaderProps) {
    const pathname = usePathname();

    const CategoryIcon =
        teamCategory === "WEB"
            ? Globe
            : teamCategory === "ANDROID"
                ? Smartphone
                : Cpu;

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

    const handleLogout = async () => {
        await logoutAction();
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-all duration-300 sm:px-6">
            {/* Left Section: Brand */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-md">
                    <span className="text-white font-bold text-xs">UJ</span>
                </div>
                <div className="hidden sm:block">
                    <h1 className="font-bold text-slate-900 leading-tight text-sm">
                        UOLJudge
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        Contest Portal
                    </p>
                </div>
            </div>

            {/* Center Section: Navigation & Timer */}
            <div className="flex items-center gap-6">
                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                    {navigation.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.name === "Leaderboard" && pathname.startsWith("/leaderboard"));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                target={item.name === "Leaderboard" ? "_blank" : undefined}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-white text-blue-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
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

                {/* Timer Divider */}
                <div className="h-8 w-px bg-slate-200 hidden md:block" />

                {/* Timer */}
                {contestEndTime && contestStartTime && contestId && (
                    <div className="hidden sm:block">
                        <ContestTimer
                            initialEndTime={contestEndTime}
                            initialStartTime={contestStartTime}
                            initialPauseState={isPaused || false}
                            contestId={contestId}
                        />
                    </div>
                )}
            </div>

            {/* Right Section: Stats & Profile */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* Score Badge */}
                <div className="hidden sm:flex flex-col items-end md:items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Score
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-slate-600">
                        <Trophy size={14} className="text-amber-500" />
                        <span className="text-sm leading-none">{teamScore}</span>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                {/* User Profile */}
                <div className="flex items-center gap-3">
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
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-bold text-xs">
                        {teamName.charAt(0).toUpperCase()}
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                        title="Sign out"
                    >
                        <LogOut size={18} />
                    </Button>
                </div>
            </div>
        </header>
    );
}
