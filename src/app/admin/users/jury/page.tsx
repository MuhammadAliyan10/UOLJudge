import { getJuryMembersWithAssignments } from "@/server/actions/jury/jury-management";
import { Shield, Users, Calendar, ShieldPlus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/shared/ui/table";
import { Card, CardContent } from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { CreateJuryDialog } from "@/features/admin/components/jury/CreateJuryDialog";
import { JuryActions } from "@/features/admin/components/jury/JuryActions";

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
                        <CreateJuryDialog />
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
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                                    <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Username
                                    </TableHead>
                                    <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Assigned Contests
                                    </TableHead>
                                    <TableHead className="h-10 py-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        Created At
                                    </TableHead>
                                    <TableHead className="w-[50px] h-10 py-0"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {juryMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                                            No jury members found. Create your first jury member to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    juryMembers.map((jury) => (
                                        <TableRow
                                            key={jury.id}
                                            className="group border-slate-50 hover:bg-slate-50/80 transition-all"
                                        >
                                            <TableCell className="py-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <ShieldPlus size={14} className="text-primary" />
                                                    <code className="text-sm  font-bold text-slate-900">
                                                        {jury.username}
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 align-middle">
                                                {jury.assignedContests.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic">No contests assigned</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {jury.assignedContests.map((contest) => (
                                                            <Badge
                                                                key={contest.id}
                                                                variant="outline"
                                                                className="rounded-sm  text-[10px] tracking-wide px-2 py-0.5 bg-primary text-white border-primary"
                                                            >
                                                                {contest.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 align-middle">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Calendar size={12} />
                                                    {new Date(jury.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-4 py-4 align-middle">
                                                <JuryActions jury={jury} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
