'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/server/actions/auth';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Contests', href: '/admin/contests', icon: '🏆' },
    { name: 'Teams', href: '/admin/teams', icon: '👥' },
    { name: 'Logs', href: '/admin/logs', icon: '📋' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toUTCString().replace('GMT', 'UTC')
            );
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await logoutAction();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">UJ</span>
                        </div>
                        <span className="text-white font-semibold">Admin Panel</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-all text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            {navigation.find((item) => item.href === pathname)?.name ||
                                'Dashboard'}
                        </h2>
                    </div>
                    <div className="text-sm text-slate-400 font-mono">
                        Server Time (UTC): {currentTime}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
