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
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isStartingSoon, setIsStartingSoon] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = start.getTime() - now.getTime();

            if (diff <= 0) {
                // Contest has started, trigger refresh
                window.location.reload();
                return;
            }

            if (diff < 5 * 60 * 1000) setIsStartingSoon(true);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <Card className="max-w-2xl w-full border-slate-200 shadow-lg">
                <CardContent className="p-8 md:p-12">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`p-4 rounded-full ${isStartingSoon ? 'bg-amber-50 animate-pulse' : 'bg-blue-50'}`}>
                            <CalendarClock
                                size={48}
                                className={isStartingSoon ? 'text-amber-600' : 'text-blue-600'}
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-3 mb-8">
                        <Badge
                            variant="outline"
                            className={`${isStartingSoon ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'} text-xs font-medium px-3 py-1`}
                        >
                            {isStartingSoon ? 'Starting Soon!' : 'Scheduled'}
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Contest Not Started
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {contestName}
                        </p>
                    </div>

                    {/* Countdown */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 mb-6 border border-slate-200">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Clock className="text-slate-500" size={20} />
                            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                Contest Starts In
                            </span>
                        </div>
                        <div className={`text-center font-mono text-5xl md:text-6xl font-bold ${isStartingSoon ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                            {timeRemaining || '--:--:--'}
                        </div>
                        <div className="flex justify-center gap-8 mt-4 text-xs text-slate-500 uppercase tracking-wider">
                            <span>Hours</span>
                            <span>Minutes</span>
                            <span>Seconds</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-900 text-center">
                            <strong>Start Time:</strong> {new Date(startTime).toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2"
                        >
                            <Link href={`/leaderboard/${contestId}`} target="_blank">
                                <Trophy size={16} />
                                View Leaderboard
                            </Link>
                        </Button>
                    </div>

                    {/* Auto-refresh notice */}
                    <p className="text-xs text-slate-400 text-center mt-6">
                        This page will automatically refresh when the contest starts
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
