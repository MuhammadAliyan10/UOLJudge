import { db as prisma } from "@/lib/db";
import { SettingsClient } from "@/features/admin/components/settings/SettingsClient";
import { getAllSystemSettings } from "@/features/admin/server-actions/admin-settings";

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
    systemSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teamProfile.count(),
    prisma.contest.count(),
    prisma.problem.count(),
    prisma.submission.count(),
    prisma.systemLog.count(),
    getAllSystemSettings(),
  ]);

  const counts = {
    userCount,
    teamCount,
    contestCount,
    problemCount,
    submissionCount,
    logCount,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform configuration and database statistics.
        </p>
      </div>

      {/* Settings Client with Tabs */}
      <SettingsClient
        initialSettings={systemSettings}
        counts={counts}
      />
    </div>
  );
}


