'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Trophy, CalendarClock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PreContestPageProps {
    contestName: string;
    startTime: Date;
    contestId: string;
}

export function PreContestPage({ contestName, startTime, contestId }: PreContestPageProps) {
    const [isStartingSoon, setIsStartingSoon] = useState(false);

    useEffect(() => {
        const checkStart = () => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = start.getTime() - now.getTime();

            if (diff <= 0) {
                window.location.reload();
                return;
            }

            if (diff < 5 * 60 * 1000) setIsStartingSoon(true);
        };

        checkStart();
        const interval = setInterval(checkStart, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <Card className="max-w-2xl w-full border-slate-200 shadow-xl bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12 text-center">
                    <div className="mb-8 relative">
                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isStartingSoon ? 'bg-amber-100 animate-pulse' : 'bg-blue-50'}`}>
                            <CalendarClock
                                size={48}
                                className={isStartingSoon ? 'text-amber-600' : 'text-blue-600'}
                            />
                        </div>
                        {isStartingSoon && (
                            <Badge className="absolute top-0 right-1/2 translate-x-12 bg-amber-500 hover:bg-amber-600 text-white border-none animate-bounce">
                                Starting Soon
                            </Badge>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        {contestName}
                    </h1>

                    <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto">
                        The contest has not started yet. Please wait for the official start time.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 inline-block w-full max-w-md">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Official Start Time
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                            {new Date(startTime).toLocaleString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            variant="default"
                            size="lg"
                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white gap-2"
                            asChild
                        >
                            <Link href={`/leaderboard/${contestId}`} target="_blank">
                                <Trophy size={18} />
                                View Leaderboard
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto gap-2"
                            onClick={() => window.location.reload()}
                        >
                            Check for Updates
                        </Button>
                    </div>

                    <p className="text-xs text-slate-400 mt-8 animate-pulse">
                        System will automatically refresh when contest begins...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
