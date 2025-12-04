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

    const handleDeleteSelected = async (selectedIds: string[], resetSelection?: () => void) => {
        try {
            toast.loading(`Deleting ${selectedIds.length} teams...`);

            const result = await bulkDeleteTeamsAction(selectedIds);

            if (result.success) {
                toast.dismiss();
                toast.success(`Successfully deleted ${selectedIds.length} teams`);

                // Clear table selection if reset function provided
                if (resetSelection) {
                    resetSelection();
                }

                // Refresh data
                router.refresh();
            } else {
                toast.dismiss();
                toast.error(result.error || "Failed to delete teams");
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "An unexpected error occurred");
        }
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
