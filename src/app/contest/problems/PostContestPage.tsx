'use client';

import Link from 'next/link';
import { Trophy, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PostContestPageProps {
    contestName: string;
    endTime: Date;
    contestId: string;
}

export function PostContestPage({ contestName, endTime, contestId }: PostContestPageProps) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <Card className="max-w-2xl w-full border-slate-200 shadow-lg">
                <CardContent className="p-8 md:p-12">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-full bg-emerald-50">
                            <CheckCircle2 size={48} className="text-emerald-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-3 mb-8">
                        <Badge
                            variant="outline"
                            className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-medium px-3 py-1"
                        >
                            Finished
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Contest Ended
                        </h1>
                        <p className="text-slate-600 text-lg">
                            {contestName}
                        </p>
                    </div>

                    {/* End Time Info */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Clock className="text-slate-500" size={18} />
                            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                Ended At
                            </span>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-slate-800 mb-1">
                                {new Date(endTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                            <p className="text-sm text-slate-500">
                                {new Date(endTime).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Thank You Message */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
                        <p className="text-center text-slate-700">
                            <strong className="text-blue-900">Thank you for participating!</strong>
                            <br />
                            <span className="text-sm text-slate-600">
                                The leaderboard has been finalized. Check your final ranking below.
                            </span>
                        </p>
                    </div>

                    {/* CTA Button */}
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            asChild
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 shadow-md"
                        >
                            <Link href={`/leaderboard/${contestId}`} target="_blank">
                                <Trophy size={20} />
                                View Final Leaderboard
                                <ArrowRight size={18} />
                            </Link>
                        </Button>
                    </div>

                    {/* Secondary Info */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400">
                            Submissions are now closed
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
