import { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/features/shared/ui/avatar";
import Link from "next/link";
import { LogoutButton } from "@/features/jury/components/LogoutButton";
import { JuryNavigation } from "@/features/jury/components/JuryNavigation";
import { JuryWebSocketListener } from "@/features/jury/components/JuryWebSocketListener";

export default async function JuryLayout({ children }: { children: ReactNode }) {
    const session = await getSession();

    // Middleware already protects this route
    // During revalidation, session might transiently be null - don't redirect in that case
    if (!session || session.role !== "JURY") {
        console.warn("Session missing in jury layout - this may indicate a revalidation issue");
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white border border-yellow-200 rounded-lg p-8 text-center shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Issue</h2>
                    <p className="text-slate-600 mb-6">
                        Please refresh the page or{" "}
                        <a href="/login" className="text-blue-600 hover:underline">
                            log in again
                        </a>
                        .
                    </p>
                </div>
            </div>
        );
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
                        <div className="flex items-center gap-3 px-3 h-10">
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
                        </div>
                        <LogoutButton />
                    </div>
                </div>

                {/* Navigation Tabs */}
                <JuryNavigation />
            </header>

            {/* WebSocket Listener for Real-time Updates */}
            <JuryWebSocketListener />

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
