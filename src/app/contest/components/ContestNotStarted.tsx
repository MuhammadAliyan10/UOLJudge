"use client";

import { CalendarClock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

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
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <Card className="max-w-xl w-full border-slate-200 shadow-xl bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12 text-center">
                    <div className="mb-8 relative">
                        <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                            <CalendarClock size={40} className="text-primary" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                        {contestName}
                    </h1>

                    <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                        The contest has not started yet. Please wait for the official start time.
                    </p>

                    {startTime && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-100 inline-block w-full max-w-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Starts At
                            </div>
                            <div className="text-xl font-bold text-slate-800">
                                {new Date(startTime).toLocaleString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {contestId && (
                            <Button
                                variant="default"
                                className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                                asChild
                            >
                                <Link href={`/leaderboard/${contestId}`} target="_blank">
                                    <Trophy size={16} />
                                    Leaderboard
                                </Link>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            Check for Updates
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
