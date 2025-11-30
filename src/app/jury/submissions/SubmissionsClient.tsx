"use client";

import { useState } from "react";
import { FileCode, Clock, CheckCircle, Hand, Filter } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/shared/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { Button } from "@/features/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/shared/ui/tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface SubmissionsClientProps {
    initialPendingSubmissions: PendingSubmission[];
    initialRetryRequests: RetryRequest[];
}

export function SubmissionsClient({
    initialPendingSubmissions,
    initialRetryRequests,
}: SubmissionsClientProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<"all" | "retry">("all");

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

    // Filter submissions based on retry requests
    const retryRequestIds = new Set(initialRetryRequests.map((r) => r.id));
    const filteredSubmissions =
        filter === "retry"
            ? initialPendingSubmissions.filter((s) => retryRequestIds.has(s.id))
            : initialPendingSubmissions;

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Submissions
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Review and grade pending submissions for your assigned contests.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Filter Toggle */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as "all" | "retry")}
                                className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                            >
                                <option value="all">All Submissions</option>
                                <option value="retry">Retry Requests Only</option>
                            </select>
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
                </div>

                {/* Submissions Table */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileCode size={18} />
                            {filter === "retry" ? "Retry Requests" : "Pending Submissions"}
                            <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200 font-mono">
                                {filteredSubmissions.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto">
                        {filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16">
                                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">
                                    {filter === "retry"
                                        ? "No retry requests at the moment!"
                                        : "All submissions graded! Queue is empty."}
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
                                        {filter === "retry" && (
                                            <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                Reason
                                            </TableHead>
                                        )}
                                        <TableHead className="w-[100px] h-10 py-0"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.map((submission) => {
                                        const elapsed = Math.floor(
                                            (Date.now() - new Date(submission.submittedAt).getTime()) / 60000
                                        );
                                        const isRetryRequest = retryRequestIds.has(submission.id);
                                        const retryRequest = initialRetryRequests.find((r) => r.id === submission.id);

                                        return (
                                            <TableRow
                                                key={submission.id}
                                                className={cn(
                                                    "border-slate-50 hover:bg-slate-50/80 transition-all",
                                                    isRetryRequest && "bg-orange-50/30 hover:bg-orange-50/50"
                                                )}
                                            >
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        {isRetryRequest && (
                                                            <Hand size={14} className="text-orange-600 flex-shrink-0" />
                                                        )}
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
                                                {filter === "retry" && (
                                                    <TableCell className="py-4 max-w-xs">
                                                        <p className="text-xs text-slate-600 truncate italic">
                                                            "{retryRequest?.reason || "No reason"}"
                                                        </p>
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right py-4">
                                                    <Link href={`/jury/grade/${submission.id}`}>
                                                        <Button
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 px-4 font-medium",
                                                                isRetryRequest
                                                                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                                                                    : "bg-purple-600 hover:bg-purple-700 text-white"
                                                            )}
                                                        >
                                                            {isRetryRequest ? "Review" : "Grade"}
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
