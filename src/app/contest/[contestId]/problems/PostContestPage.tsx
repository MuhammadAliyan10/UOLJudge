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
            <Card className="max-w-2xl w-full border-slate-200 shadow-xl bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12 text-center">
                    <div className="mb-8">
                        <div className="mx-auto w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
                            <Trophy size={48} className="text-emerald-600" />
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm px-4 py-1 mb-4">
                            Contest Completed
                        </Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                        {contestName}
                    </h1>

                    <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto">
                        Thank you for your participation! The contest has officially ended.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Ended At
                            </div>
                            <div className="font-mono text-lg font-bold text-slate-700">
                                {new Date(endTime).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Date
                            </div>
                            <div className="font-mono text-lg font-bold text-slate-700">
                                {new Date(endTime).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-600/20"
                        asChild
                    >
                        <Link href={`/leaderboard/${contestId}`} target="_blank">
                            <Trophy size={20} />
                            View Final Leaderboard
                            <ArrowRight size={18} />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
