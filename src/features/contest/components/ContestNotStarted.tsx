"use client";

import { Trophy, FileText } from "lucide-react";
import { Button } from "@/features/shared/ui/button";
import Link from "next/link";
import { CountdownTimer } from "./CountdownTimer";

interface ContestNotStartedProps {
    contestName?: string;
    startTime?: Date;
    contestId?: string;
}

export default function ContestNotStarted({
    contestName = "Contest",
    startTime,
    contestId,
}: ContestNotStartedProps) {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4 z-50">
            <div className="max-w-4xl w-full text-center space-y-12">
                {/* Countdown Timer */}
                {startTime && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CountdownTimer targetDate={startTime} />
                    </div>
                )}

                {/* Contest Title */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                        {contestName}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                        Get ready! The contest will begin shortly. Use the time to review the rules and check the leaderboard.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {contestId && (
                        <Button
                            size="lg"
                            variant="default"
                            className="bg-primary hover:bg-primary-700 text-white gap-2 px-8 text-lg h-14 shadow-lg hover:shadow-xl transition-all"
                            asChild
                        >
                            <Link href={`/leaderboard/${contestId}`} target="_blank">
                                <Trophy size={20} />
                                Show Leaderboard
                            </Link>
                        </Button>
                    )}
                    <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 px-8 text-lg h-14 border-slate-300 hover:bg-slate-50"
                        asChild
                    >
                        <Link href="/rules" target="_blank">
                            <FileText size={20} />
                            Read Rules & Regulations
                        </Link>
                    </Button>
                </div>

                {/* Start Time Display */}
                {startTime && (
                    <div className="animate-in fade-in duration-700 delay-500">
                        <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-200 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Contest Starts At
                            </div>
                            <div className="text-xl md:text-2xl font-bold text-slate-800">
                                {new Date(startTime).toLocaleString(undefined, {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
