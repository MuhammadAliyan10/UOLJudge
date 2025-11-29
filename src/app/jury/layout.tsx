import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { LogoutButton } from "@/components/jury/LogoutButton";

export default async function JuryLayout({ children }: { children: ReactNode }) {
    const session = await getSession();

    // Double-check authorization (middleware already protects, but defense in depth)
    if (!session || session.role !== "JURY") {
        redirect("/login");
    }

    const initials = session.username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex h-16 items-center justify-between px-6 lg:px-10">
                    <Link href="/jury" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 shadow-sm">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                Jury Portal
                            </h1>
                            <p className="text-xs text-slate-500">Grading & Review System</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-3 h-10 px-3 hover:bg-slate-100"
                                >
                                    <Avatar className="h-8 w-8 border-2 border-purple-200">
                                        <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 leading-none">
                                            Jury
                                        </span>
                                        <code className="text-sm font-mono font-bold text-purple-600 leading-none mt-0.5">
                                            {session.username}
                                        </code>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
                                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Account
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem disabled className="text-slate-500">
                                    <User size={14} className="mr-2" />
                                    Profile Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <div className="px-2 py-1.5">
                                    <LogoutButton />
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
