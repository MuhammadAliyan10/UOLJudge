"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/features/shared/ui/badge";
import { ContestActions } from "./ContestActions";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { DataTableColumnHeader } from "@/features/shared/components/ui/data-table-column-header";

// Define the shape of our data
export type Contest = {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    frozenAt: Date | null;
    _count: {
        problems: number;
    };
    problems: any[]; // We can be more specific if needed
};

// Helper for status badge
function ContestStatusBadge({ contest }: { contest: Contest }) {
    const now = new Date();
    const isActive = contest.isActive;
    const hasStarted = now >= new Date(contest.startTime);
    const hasEnded = now > new Date(contest.endTime);

    if (!isActive) {
        return (
            <Badge
                variant="outline"
                className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 font-medium rounded-md px-2.5 py-0.5 shadow-sm"
            >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Inactive
            </Badge>
        );
    }

    if (hasEnded) {
        return (
            <Badge
                variant="outline"
                className="bg-slate-50 text-slate-600 border-slate-200 gap-1.5 font-medium rounded-md px-2.5 py-0.5"
            >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Ended
            </Badge>
        );
    }

    if (!hasStarted) {
        return (
            <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 font-medium rounded-md px-2.5 py-0.5 shadow-sm"
            >
                <Clock size={12} className="text-amber-600" />
                Scheduled
            </Badge>
        );
    }

    // Live
    return (
        <Badge
            variant="outline"
            className="bg-white text-emerald-700 border-emerald-200 gap-2 pl-2 pr-3 font-medium rounded-md shadow-sm"
        >
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Now
        </Badge>
    );
}

export const columns: ColumnDef<Contest>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Contest Name" />
        ),
        cell: ({ row }) => {
            const contest = row.original;
            const isFrozen = contest.frozenAt && new Date() > new Date(contest.frozenAt);
            return (
                <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-slate-900 text-sm">
                        {contest.name}
                    </span>
                    {isFrozen && (
                        <div className="flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-100 w-fit">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                            </span>
                            Scoreboard Frozen
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "startTime",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Start Time" />
        ),
        cell: ({ row }) => {
            return (
                <div className="text-sm text-slate-600">
                    {format(new Date(row.original.startTime), "MMM d, HH:mm")}
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ContestStatusBadge contest={row.original} />,
    },
    {
        accessorKey: "_count.problems",
        header: "Problems",
        cell: ({ row }) => (
            <div className="inline-flex items-center justify-center min-w-[2rem] h-6 px-1.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {row.original._count.problems}
            </div>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => <ContestActions contest={row.original} />,
    },
];
