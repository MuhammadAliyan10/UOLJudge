"use client";

import { DataTable } from "@/features/shared/components/ui/data-table";
import { columns, Team } from "./columns";
import { bulkDeleteTeamsAction } from "@/server/actions/admin/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TeamListTableProps {
    data: Team[];
}

export function TeamListTable({ data }: TeamListTableProps) {
    const router = useRouter();

    const handleDeleteSelected = async (selectedIds: string[]) => {
        const promise = bulkDeleteTeamsAction(selectedIds);

        toast.promise(promise, {
            loading: `Deleting ${selectedIds.length} teams...`,
            success: (result) => {
                if (result.success) {
                    router.refresh();
                    return `Successfully deleted ${selectedIds.length} teams`;
                } else {
                    throw new Error(result.error);
                }
            },
            error: (err) => err.message || "Failed to delete teams",
        });
    };

    return (
        <DataTable
            columns={columns}
            data={data}
            filterColumn="display_name"
            onDeleteSelected={handleDeleteSelected}
        />
    );
}
