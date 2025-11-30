import { db as prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { Separator } from "@/features/shared/ui/separator";
import {
  Users,
  Trophy,
  FileCode,
  Activity,
  HardDrive,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  WifiOff,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // 1. Fetch System Stats
  const [
    userCount,
    teamCount,
    contestCount,
    problemCount,
    submissionCount,
    logCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teamProfile.count(),
    prisma.contest.count(),
    prisma.problem.count(),
    prisma.submission.count(),
    prisma.systemLog.count(),
  ]);

  const stats = [
    {
      label: "Total Users",
      value: userCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Registered Teams",
      value: teamCount,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Contests Created",
      value: contestCount,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Problem Bank",
      value: problemCount,
      icon: FileCode,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total Submissions",
      value: submissionCount,
      icon: HardDrive,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Audit Logs",
      value: logCount,
      icon: Activity,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          System Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Platform configuration and database statistics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server size={20} className="text-slate-400" />
              Environment Details
            </CardTitle>
            <CardDescription>
              Current runtime configuration and versioning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Platform Name</span>
              <span className="font-mono font-medium text-slate-900">
                UOLJudge
              </span>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Version</span>
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-600 border-slate-200"
              >
                v3.0.0 (Stable)
              </Badge>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Environment</span>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                {process.env.NODE_ENV || "development"}
              </code>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Mode</span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1.5 pl-1.5 pr-2.5 shadow-none">
                <WifiOff size={12} />
                Offline-First
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database size={20} className="text-slate-400" />
              Database Status
            </CardTitle>
            <CardDescription>
              Connection and ORM specifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Provider</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-medium text-slate-900">PostgreSQL</span>
              </div>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">ORM Version</span>
              <span className="font-mono text-sm text-slate-600">
                Prisma v5.22.0
              </span>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Port</span>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                5435
              </code>
            </div>
            <Separator className="bg-slate-100" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Infrastructure</span>
              <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium">
                <Cpu size={14} />
                Docker Container
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
