import { getJuryMembersWithAssignments } from "@/server/actions/jury/jury-management";
import { ShieldPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/features/shared/ui/card";
import { CreateJurySheet } from "@/features/admin/components/jury/CreateJurySheet";
import { DataTable } from "@/features/shared/components/ui/data-table";
import { columns } from "@/features/admin/components/jury/columns";
import { EmptyState } from "@/features/shared/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function JuryManagementPage() {
    const juryMembers = await getJuryMembersWithAssignments();

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <ShieldPlus className="h-8 w-8 text-secondary" />
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Jury Management
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Manage jury members and their contest assignments with zero-trust access control.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <CreateJurySheet />
                    </div>
                </div>

                {/* Data Grid Card */}
                <Card className="border border-slate-200 shadow-sm bg-white rounded-md overflow-hidden ring-1 ring-slate-950/5">
                    {/* Toolbar */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white gap-4">
                        <div className="flex items-center gap-3 text-xs text-slate-500 ">
                            <Users size={14} className="text-slate-400" />
                            <span>
                                JURY MEMBERS: <strong className="text-slate-900">{juryMembers.length}</strong>
                            </span>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {juryMembers.length === 0 ? (
                            <div className="p-6">
                                <EmptyState
                                    icon={ShieldPlus}
                                    title="No Jury Members"
                                    description="Create your first jury member to get started."
                                />
                            </div>
                        ) : (
                            <div className="p-6">
                                <DataTable columns={columns} data={juryMembers} filterColumn="username" />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
