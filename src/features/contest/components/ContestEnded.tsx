"use client";

import { Trophy, Sparkles } from "lucide-react";
import { Button } from "@/features/shared/ui/button";
import Link from "next/link";

interface ContestEndedProps {
    contestId?: string;
}

export default function ContestEnded({ contestId }: ContestEndedProps) {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center px-4 z-50">
            <div className="max-w-4xl w-full text-center space-y-12">
                {/* Icon */}
                <div className="animate-in zoom-in duration-700">
                    <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center mb-6 shadow-lg">
                        <Trophy size={64} className="text-emerald-600" />
                    </div>
                </div>

                {/* Title & Message */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight">
                        Contest Ended
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Thank you for participating! 🎉 View the final leaderboard to see how you ranked.
                    </p>
                </div>

                {/* Leaderboard Button */}
                {contestId && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <Button
                            size="lg"
                            variant="default"
                            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white gap-2 px-12 text-xl h-16 shadow-2xl hover:shadow-emerald-200 transition-all"
                            asChild
                        >
                            <Link href={`/leaderboard/${contestId}`} target="_blank">
                                <Sparkles size={24} />
                                View Final Leaderboard
                                <Trophy size={24} />
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Thank You Message */}
                <div className="animate-in fade-in duration-700 delay-500">
                    <p className="text-slate-500 text-sm md:text-base italic">
                        "The journey was as important as the destination. Well done, everyone!" 💪
                    </p>
                </div>
            </div>
        </div>
    );
}
