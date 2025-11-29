"use client";

import { Trophy, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface ContestEndedProps {
    contestId?: string;
}

export default function ContestEnded({ contestId }: ContestEndedProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <Card className="max-w-xl w-full border-slate-200 shadow-xl bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12 text-center">
                    <div className="mb-8 relative">
                        <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <Trophy size={40} className="text-slate-400" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                        Contest Ended
                    </h1>

                    <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                        The contest has officially ended. Thank you for participating!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {contestId && (
                            <Button
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                asChild
                            >
                                <Link href={`/leaderboard/${contestId}`} target="_blank">
                                    <Trophy size={16} />
                                    Final Leaderboard
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/">
                                <Home size={16} className="mr-2" />
                                Back Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
