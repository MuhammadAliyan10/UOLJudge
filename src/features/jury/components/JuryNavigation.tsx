"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileCode, History } from "lucide-react";

export function JuryNavigation() {
    const pathname = usePathname();

    const tabs = [
        {
            label: "Dashboard",
            href: "/jury",
            icon: LayoutDashboard,
            active: pathname === "/jury",
        },
        {
            label: "Submissions",
            href: "/jury/submissions",
            icon: FileCode,
            active: pathname === "/jury/submissions" || pathname.startsWith("/jury/grade"),
        },
        {
            label: "History",
            href: "/jury/history",
            icon: History,
            active: pathname === "/jury/history",
        },
    ];

    return (
        <div className="border-t border-slate-100 bg-slate-50/50">
            <div className="px-6 lg:px-10">
                <nav className="flex gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                                    "border-b-2 hover:text-purple-600 hover:border-purple-200",
                                    tab.active
                                        ? "text-purple-600 border-purple-600 bg-white"
                                        : "text-slate-600 border-transparent"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
