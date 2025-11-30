import { db as prisma } from "@/lib/db";
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
import {
  ScrollText,
  LogIn,
  Upload,
  Gavel,
  Ban,
  Settings,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  // 1. Fetch Logs
  const logs = await prisma.systemLog.findMany({
    include: { user: { select: { username: true } } },
    orderBy: { timestamp: "desc" },
    take: 100, // Limit to recent 100 for performance
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            System Logs
          </h1>
          <p className="text-slate-500 mt-1">
            Audit trail for security and administrative actions.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-500">
          <Terminal size={16} className="text-slate-400" />
          Showing last{" "}
          <span className="font-bold text-slate-900">{logs.length}</span>{" "}
          entries
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ScrollText size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                No logs recorded
              </h3>
              <p className="text-slate-500 max-w-sm mt-1">
                System activities will appear here once users interact with the
                platform.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[200px]">Action</TableHead>
                  <TableHead className="w-[150px]">Actor</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right w-[150px]">
                    IP Address
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 group">
                    {/* Timestamp */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 tabular-nums">
                          {log.timestamp.toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500 font-mono tabular-nums">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Action Badge */}
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>

                    {/* Actor */}
                    <TableCell>
                      {log.user ? (
                        <div className="font-medium text-slate-900">
                          @{log.user.username}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">
                          System
                        </span>
                      )}
                    </TableCell>

                    {/* Details */}
                    <TableCell>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-[500px] truncate group-hover:whitespace-normal transition-all">
                        {log.details}
                      </p>
                    </TableCell>

                    {/* IP */}
                    <TableCell className="text-right">
                      <code className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {log.ip_address || "internal"}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Components ---

function ActionBadge({ action }: { action: string }) {
  const configs: Record<string, { style: string; icon: any; label: string }> = {
    LOGIN: {
      style: "bg-blue-50 text-blue-700 border-blue-200",
      icon: LogIn,
      label: "User Login",
    },
    SUBMISSION: {
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Upload,
      label: "Submission",
    },
    MANUAL_GRADE_UPDATE: {
      style: "bg-purple-50 text-purple-700 border-purple-200",
      icon: Gavel,
      label: "Manual Grade",
    },
    BAN_USER: {
      style: "bg-red-50 text-red-700 border-red-200",
      icon: Ban,
      label: "User Banned",
    },
    CONTEST_UPDATE: {
      style: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Settings,
      label: "Config Change",
    },
  };

  const config = configs[action] || {
    style: "bg-slate-50 text-slate-600 border-slate-200",
    icon: ShieldAlert,
    label: action,
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 pl-1.5 pr-2.5 py-1 font-normal", config.style)}
    >
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}
