"use client";

import { useState } from "react";
import { History, CheckCircle2, XCircle, Search } from "lucide-react";
import { SubmissionStatus } from "@prisma/client";
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
import { Input } from "@/features/shared/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GradedSubmission {
    id: string;
    status: SubmissionStatus;
    finalScore: number;
    submittedAt: Date;
    juryComment: string | null;
    judgedBy: string | null;
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

interface HistoryClientProps {
    initialGradedSubmissions: GradedSubmission[];
}

export function HistoryClient({ initialGradedSubmissions }: HistoryClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");

    // Filter submissions
    const filteredSubmissions = initialGradedSubmissions.filter((submission) => {
        const matchesSearch =
            submission.team.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            submission.problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            submission.contest.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || submission.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Grading History
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        View all previously graded submissions for your assigned contests.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by team, problem, or contest..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white border-slate-200"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | SubmissionStatus)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="ACCEPTED">Accepted Only</option>
                        <option value="REJECTED">Rejected Only</option>
                    </select>
                </div>

                {/* History Table */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <History size={18} />
                            Graded Submissions
                            <Badge variant="outline" className="ml-2 bg-slate-50 text-slate-700 border-slate-200 font-mono">
                                {filteredSubmissions.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredSubmissions.length === 0 ? (
                            <div className="text-center py-16">
                                <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">
                                    {searchQuery || statusFilter !== "all"
                                        ? "No submissions match your filters"
                                        : "No grading history yet"}
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
                                            Submitted
                                        </TableHead>
                                        <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Judged By
                                        </TableHead>
                                        <TableHead className="text-center h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Status
                                        </TableHead>
                                        <TableHead className="w-[120px] h-10 py-0"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.map((submission) => (
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
                                                <span className="text-xs text-slate-500">
                                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <code className="text-xs font-mono text-slate-600">
                                                    {submission.judgedBy || "Unknown"}
                                                </code>
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "gap-1.5 font-medium",
                                                        submission.status === "ACCEPTED"
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : "bg-red-50 text-red-700 border-red-200"
                                                    )}
                                                >
                                                    {submission.status === "ACCEPTED" ? (
                                                        <CheckCircle2 size={12} />
                                                    ) : (
                                                        <XCircle size={12} />
                                                    )}
                                                    {submission.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <Link href={`/jury/grade/${submission.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8 px-3">
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
