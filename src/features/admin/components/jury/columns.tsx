"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/features/shared/ui/badge";
import { JuryActions } from "./JuryActions";
import { ShieldPlus, Calendar } from "lucide-react";
import { DataTableColumnHeader } from "@/features/shared/components/ui/data-table-column-header";

// Define the shape of our data
export type JuryMember = {
    id: string;
    username: string;
    created_at: Date;
    assignedContests: Array<{
        id: string;
        name: string;
    }>;
};

export const columns: ColumnDef<JuryMember>[] = [
    {
        accessorKey: "username",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Username" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2">
                    <ShieldPlus size={14} className="text-primary" />
                    <code className="text-sm font-bold text-slate-900">
                        {row.original.username}
                    </code>
                </div>
            );
        },
    },
    {
        accessorKey: "assignedContests",
        header: "Assigned Contests",
        cell: ({ row }) => {
            const contests = row.original.assignedContests;
            if (contests.length === 0) {
                return <span className="text-xs text-slate-400 italic">No contests assigned</span>;
            }
            return (
                <div className="flex flex-wrap gap-1.5">
                    {contests.map((contest) => (
                        <Badge
                            key={contest.id}
                            variant="outline"
                            className="rounded-sm text-[10px] tracking-wide px-2 py-0.5 bg-primary text-white border-primary"
                        >
                            {contest.name}
                        </Badge>
                    ))}
                </div>
            );
        },
    },
    {
        accessorKey: "created_at",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={12} />
                    {new Date(row.original.created_at).toLocaleDateString()}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <JuryActions jury={row.original} />,
    },
];
