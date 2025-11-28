'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/server/actions/auth';

const navigation = [
    { name: 'Problems', href: '/contest/problems' },
    { name: 'Leaderboard', href: '/leaderboard' },
];

interface ContestLayoutClientProps {
    teamName: string;
    teamScore: number;
    contestEndTime?: Date;
    children: React.ReactNode;
}

export function ContestLayoutClient({
    teamName,
    teamScore,
    contestEndTime,
    children,
}: ContestLayoutClientProps) {
    const pathname = usePathname();
    const [timeRemaining, setTimeRemaining] = useState('--:--:--');

    useEffect(() => {
        if (!contestEndTime) return;

        const updateTimer = () => {
            const now = new Date();
            const end = new Date(contestEndTime);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [contestEndTime]);

    const handleLogout = async () => {
        await logoutAction();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Top Bar */}
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="container mx-auto px-6">
                    <div className="h-16 flex items-center justify-between">
                        {/* Logo + Contest Name */}
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg font-bold">UJ</span>
                            </div>
                            <div>
                                <h1 className="text-white font-semibold">UOLJudge Contest</h1>
                                <p className="text-xs text-slate-400">Competitive Programming</p>
                            </div>
                        </div>

                        {/* Team Info + Actions */}
                        <div className="flex items-center space-x-6">
                            <div className="hidden md:flex items-center space-x-6 text-sm">
                                <div>
                                    <div className="text-slate-400 text-xs">Team</div>
                                    <div className="text-white font-medium">{teamName}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">Score</div>
                                    <div className="text-green-400 font-bold">{teamScore}</div>
                                </div>
                                {contestEndTime && (
                                    <div>
                                        <div className="text-slate-400 text-xs">Time Remaining</div>
                                        <div className="text-white font-mono">{timeRemaining}</div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-all text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex space-x-1 pb-px">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`px-6 py-3 font-medium transition-all ${isActive
                                            ? 'text-blue-400 border-b-2 border-blue-400'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-8">{children}</main>
        </div>
    );
}
