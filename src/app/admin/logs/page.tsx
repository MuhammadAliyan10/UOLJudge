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
import { Button } from "@/features/shared/ui/button";
import {
  ScrollText,
  LogIn,
  Upload,
  Gavel,
  Ban,
  Settings,
  ShieldAlert,
  Terminal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Pakistan Standard Time formatter
function formatPKT(date: Date): { date: string; time: string } {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  return {
    date: new Intl.DateTimeFormat("en-PK", options).format(date),
    time: new Intl.DateTimeFormat("en-PK", timeOptions).format(date),
  };
}

const LOGS_PER_PAGE = 25;

interface LogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  // 1. Get total count for pagination
  const totalLogs = await prisma.systemLog.count();
  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  // 2. Fetch paginated logs
  const logs = await prisma.systemLog.findMany({
    include: { user: { select: { username: true } } },
    orderBy: { timestamp: "desc" },
    skip: (currentPage - 1) * LOGS_PER_PAGE,
    take: LOGS_PER_PAGE,
  });

  const startEntry = (currentPage - 1) * LOGS_PER_PAGE + 1;
  const endEntry = Math.min(currentPage * LOGS_PER_PAGE, totalLogs);

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
          <span className="font-bold text-slate-900">{totalLogs}</span> total
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
                  <TableHead className="w-[180px]">Timestamp (PKT)</TableHead>
                  <TableHead className="w-[180px]">Action</TableHead>
                  <TableHead className="w-[140px]">Actor</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right w-[130px]">
                    IP Address
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const formattedTime = formatPKT(log.timestamp);
                  return (
                    <TableRow
                      key={log.id}
                      className="hover:bg-slate-50/50 group"
                    >
                      {/* Timestamp - Pakistan Standard Time */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 tabular-nums">
                            {formattedTime.date}
                          </span>
                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            {formattedTime.time}
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
                          <div className="font-medium text-slate-900 text-sm">
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
                        <p className="text-sm text-slate-600 leading-relaxed max-w-[400px] truncate group-hover:whitespace-normal transition-all">
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-900">{startEntry}</span> to{" "}
            <span className="font-medium text-slate-900">{endEntry}</span> of{" "}
            <span className="font-medium text-slate-900">{totalLogs}</span> logs
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
              className="h-9"
            >
              {currentPage > 1 ? (
                <Link href={`/admin/logs?page=${currentPage - 1}`}>
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Link>
              ) : (
                <>
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </>
              )}
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 w-9 p-0",
                      currentPage === pageNum && "bg-primary text-white"
                    )}
                    asChild={currentPage !== pageNum}
                  >
                    {currentPage === pageNum ? (
                      <span>{pageNum}</span>
                    ) : (
                      <Link href={`/admin/logs?page=${pageNum}`}>
                        {pageNum}
                      </Link>
                    )}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
              className="h-9"
            >
              {currentPage < totalPages ? (
                <Link href={`/admin/logs?page=${currentPage + 1}`}>
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              ) : (
                <>
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
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
      className={cn(
        "gap-1.5 pl-1.5 pr-2.5 py-1 font-normal text-xs",
        config.style
      )}
    >
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}
