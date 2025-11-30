"use client";

import { Calendar, AlertCircle, Users, CheckCircle2, Clock, Hand } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useContestSocket } from "@/hooks/useContestSocket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Contest {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    pendingCount: number;
}

interface Stats {
    totalTeams: number;
    pendingSubmissions: number;
    retryRequests: number;
    gradedToday: number;
}

interface RetryRequest {
    id: string;
    reason: string;
    requestedAt: Date | null;
    team: {
        display_name: string;
        lab_location: string | null;
    };
    problem: {
        id: string;
        title: string;
        contestId: string;
    };
}

interface RecentLog {
    id: string;
    action: string;
    message: string;
    details: string;
    timestamp: Date;
    username: string;
    role: string | null;
    level: string;
}

interface JuryDashboardClientProps {
    initialContests: Contest[];
    initialStats: Stats;
    initialRetryRequests: RetryRequest[];
    initialRecentLogs: RecentLog[];
}

export function JuryDashboardClient({
    initialContests,
    initialStats,
    initialRetryRequests,
    initialRecentLogs,
}: JuryDashboardClientProps) {
    const router = useRouter();

    // Connect to WebSocket for real-time updates
    // Note: Server actions already callrevalidatePath(), so no need for router.refresh()
    // which was causing session invalidation issues
    const { isConnected } = useContestSocket({
        onNewSubmission: (payload) => {
            toast.success(`New submission from ${payload.teamName}!`, {
                description: "Pending queue updated",
                duration: 5000,
            });
        },
        onJuryQueueUpdate: (payload) => {
            // UI will auto-update via revalidatePath
        },
        onRetryRequested: (payload) => {
            toast.info(`${payload.teamName} requested retry`, {
                description: payload.problemTitle,
                duration: 6000,
            });
        },
        onRetryGranted: (payload) => {
            toast.success("Retry granted!", {
                description: "Team can now submit again",
                duration: 5000,
            });
        },
    });

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Overview of your grading activities and assigned contests.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full",
                                isConnected ? "bg-green-500" : "bg-slate-300"
                            )}
                        />
                        <span className="text-xs text-slate-500">
                            {isConnected ? "Live" : "Connecting..."}
                        </span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Users size={14} />
                                Total Teams
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {initialStats.totalTeams}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Pending Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600">
                                {initialStats.pendingSubmissions}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Hand size={14} />
                                Retry Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">
                                {initialStats.retryRequests}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <CheckCircle2 size={14} />
                                Graded Today
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {initialStats.gradedToday}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Retry Requests Card */}
                    {initialRetryRequests.length > 0 && (
                        <Card className="border-orange-200 shadow-sm bg-orange-50/30">
                            <CardHeader className="border-b border-orange-100 bg-orange-50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold text-orange-900 flex items-center gap-2">
                                        <Hand size={18} className="text-orange-600" />
                                        Pending Retry Requests
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 font-mono">
                                        {initialRetryRequests.length}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[300px] overflow-y-auto">
                                    <div className="p-4 space-y-3">
                                        {initialRetryRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm space-y-2"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">
                                                            {request.team.display_name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-mono">
                                                            {request.problem.title}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {request.requestedAt
                                                            ? new Date(request.requestedAt).toLocaleDateString()
                                                            : "Unknown"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                                                    "{request.reason}"
                                                </p>
                                                <Link href={`/jury/grade/${request.id}`}>
                                                    <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                                        Review & Grant
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Activity Logs */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Clock size={18} />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[300px] overflow-y-auto">
                                <div className="p-4 space-y-2">
                                    {initialRecentLogs.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-8">
                                            No recent activity
                                        </p>
                                    ) : (
                                        initialRecentLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex flex-col items-center min-w-[4px]">
                                                    <div
                                                        className={cn(
                                                            "h-2 w-2 rounded-full",
                                                            log.level === "ERROR"
                                                                ? "bg-red-500"
                                                                : log.level === "WARN"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-blue-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs font-mono font-bold text-slate-700">
                                                            {log.username}
                                                        </code>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(log.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{log.message}</p>
                                                    {log.details && (
                                                        <p className="text-xs text-slate-400">{log.details}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Assigned Contests */}
                    <Card className="border-slate-200 shadow-sm lg:col-span-2">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-lg font-bold text-slate-900">
                                Your Assigned Contests
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {initialContests.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium">
                                        No contests assigned yet. Contact an administrator.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {initialContests.map((contest) => {
                                        const now = new Date();
                                        const isActive = now >= contest.startTime && now <= contest.endTime;
                                        const hasEnded = now > contest.endTime;

                                        return (
                                            <div
                                                key={contest.id}
                                                className="p-4 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors bg-white"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <h3 className="font-bold text-slate-900 text-sm">
                                                        {contest.name}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] font-mono",
                                                            isActive
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : hasEnded
                                                                    ? "bg-slate-50 text-slate-500 border-slate-200"
                                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                                        )}
                                                    >
                                                        {isActive ? "ACTIVE" : hasEnded ? "ENDED" : "UPCOMING"}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2 text-xs text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={12} />
                                                        {new Date(contest.startTime).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle size={12} className="text-purple-500" />
                                                        <span className="font-mono font-bold text-purple-600">
                                                            {contest.pendingCount} pending
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
