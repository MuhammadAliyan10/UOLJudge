"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/features/shared/ui/badge";
import { TeamActions } from "./TeamActions";
import { CheckCircle2, Ban, Hash, MapPin, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/features/shared/ui/checkbox";
import { DataTableColumnHeader } from "@/features/shared/components/ui/data-table-column-header";

// Define the shape of our data based on the Prisma query in page.tsx
export type Team = {
    id: string; // TeamProfile ID
    display_name: string;
    members: any; // JSON
    category: string; // Enum
    lab_location: string | null;
    max_devices: number | null;
    authorized_devices: any | null; // JSON
    user: {
        id: string;
        username: string;
        is_active: boolean;
    };
    assigned_contest: {
        id: string;
        name: string;
    } | null;
    team_score?: {
        totalScore: number;
        totalPenalty: number;
    } | null;
};

// Helper for category styles
const CATEGORY_STYLES: Record<string, string> = {
    CORE: "bg-purple-50 text-purple-700 border-purple-200",
    WEB: "bg-blue-50 text-blue-700 border-blue-200",
    ANDROID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const columns: ColumnDef<Team>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "display_name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Team Name" />
        ),
        cell: ({ row }) => {
            const team = row.original;
            return (
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                        {team.display_name}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Hash size={10} className="text-slate-400" />
                        <code className="text-[10px] text-slate-500">
                            {team.user.username}
                        </code>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "category",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ row }) => {
            const category = String(row.original.category || "CORE");
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        "rounded-sm text-[10px] tracking-wide px-1.5 py-0.5 uppercase",
                        CATEGORY_STYLES[category] || "bg-slate-50 text-slate-500 border-slate-200"
                    )}
                >
                    {category}
                </Badge>
            );
        },
    },
    {
        accessorKey: "assigned_contest.name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Contest & Lab" />
        ),
        cell: ({ row }) => {
            const team = row.original;
            return (
                <div className="flex flex-col gap-1.5">
                    {team.assigned_contest ? (
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                            {team.assigned_contest.name}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                    {team.lab_location && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <MapPin size={10} />
                            {team.lab_location}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "devices",
        header: "Devices",
        cell: ({ row }) => {
            const team = row.original;
            const authorizedDevices = (team.authorized_devices as any[]) || [];
            const count = authorizedDevices.length;
            const max = team.max_devices || 2;

            return (
                <div className="flex items-center gap-1.5">
                    <Monitor size={12} className="text-slate-400" />
                    <span className="font-mono text-xs font-medium text-slate-700">
                        {count}/{max}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: "user.is_active",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.original.user.is_active;
            return isActive ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <CheckCircle2 size={10} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                </div>
            ) : (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700">
                    <Ban size={10} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Banned</span>
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const team = row.original;
            // Map to the structure expected by TeamActions/EditTeamSheet
            const teamForEdit = {
                id: team.user.id,
                username: team.user.username,
                is_active: team.user.is_active,
                team_profile: {
                    display_name: team.display_name,
                    members: team.members,
                    category: team.category,
                    lab_location: team.lab_location,
                    max_devices: team.max_devices || 2,
                    assigned_contest_id: team.assigned_contest?.id || null,
                    is_blocked: !team.user.is_active // Assuming is_active false means blocked/banned
                },
            };
            return <TeamActions team={teamForEdit} />;
        },
    },
];
