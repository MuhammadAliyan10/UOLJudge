"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, FileCode, Users, AlertCircle, CheckCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useContestSocket } from "@/hooks/useContestSocket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Contest {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    pendingCount: number;
}

interface PendingSubmission {
    id: string;
    fileUrl: string;
    fileType: string;
    submittedAt: Date;
    team: {
        display_name: string;
        lab_location: string | null;
    };
    problem: {
        id: string;
        title: string;
        contestId: string;
    };
    contest: {
        id: string;
        name: string;
    };
}

export interface JuryDashboardClientProps {
    initialContests: Contest[];
    initialPendingSubmissions: PendingSubmission[];
}

export default function JuryDashboardClient({
    initialContests,
    initialPendingSubmissions,
}: JuryDashboardClientProps) {
    const router = useRouter();
    const [contests, setContests] = useState(initialContests);
    const [pendingSubmissions, setPendingSubmissions] = useState(initialPendingSubmissions);

    const totalPending = contests.reduce((sum, c) => sum + c.pendingCount, 0);

    // Connect to WebSocket for real-time updates
    const { isConnected } = useContestSocket({
        onNewSubmission: (payload) => {
            // Check if this submission is for a contest we're assigned to
            const isAssignedContest = contests.some((c) => c.id === payload.contestId);
            if (isAssignedContest) {
                toast.success(`New submission from ${payload.teamName}!`, {
                    description: "Pending queue updated",
                    duration: 5000,
                });
                // Refresh data to show new submission
                router.refresh();
            }
        },
        onJuryQueueUpdate: (payload) => {
            // Another jury graded something - refresh queue
            const isAssignedContest = contests.some((c) => c.id === payload.contestId);
            if (isAssignedContest) {
                router.refresh();
            }
        },
    });

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header with connection status */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Grading Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Review and grade submissions for your assigned contests.
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

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Calendar size={14} />
                                Assigned Contests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{contests.length}</div>
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
                            <div className="text-3xl font-bold text-purple-600">{totalPending}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <FileCode size={14} />
                                Recent Submissions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {pendingSubmissions.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assigned Contests */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-bold text-slate-900">
                            Your Assigned Contests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {contests.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">
                                    No contests assigned yet. Contact an administrator.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {contests.map((contest) => {
                                    const now = new Date();
                                    const isActive = now >= contest.startTime && now <= contest.endTime;
                                    const hasEnded = now > contest.endTime;

                                    return (
                                        <div
                                            key={contest.id}
                                            className="p-4 border border-slate-200 rounded-lg hover:border-purple-300 transition-colors bg-white"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-bold text-slate-900 text-sm">{contest.name}</h3>
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

                {/* Pending Submissions Queue */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileCode size={18} />
                            Pending Submissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {pendingSubmissions.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">
                                    All submissions graded! Queue is empty.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                                        <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Team
                                        </TableHead>
                                        <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Problem
                                        </TableHead>
                                        <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Contest
                                        </TableHead>
                                        <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Time Elapsed
                                        </TableHead>
                                        <TableHead className="w-[100px] h-10 py-0"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingSubmissions.map((submission) => {
                                        const elapsed = Math.floor(
                                            (Date.now() - new Date(submission.submittedAt).getTime()) / 60000
                                        );

                                        return (
                                            <TableRow
                                                key={submission.id}
                                                className="border-slate-50 hover:bg-slate-50/80 transition-all"
                                            >
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {submission.team.display_name}
                                                        </span>
                                                        {submission.team.lab_location && (
                                                            <span className="text-xs text-slate-500">
                                                                {submission.team.lab_location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <code className="text-sm font-mono text-slate-700">
                                                        {submission.problem.title}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="text-sm text-slate-600">
                                                        {submission.contest.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Clock size={12} />
                                                        {elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h`} ago
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    <Link href={`/jury/grade/${submission.id}`}>
                                                        <Button
                                                            size="sm"
                                                            className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-4 font-medium"
                                                        >
                                                            Grade
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
