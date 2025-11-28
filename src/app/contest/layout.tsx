import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ContestLayoutClient } from "./ContestLayoutClient";
import { AlertTriangle, Clock, CalendarOff } from "lucide-react";

export const dynamic = "force-dynamic";

// --- Helper Component for Inactive/Scheduled/Ended States (Rendered by Server) ---
function ContestStatusScreen({
  title,
  message,
  icon: Icon,
}: {
  title: string;
  message: string;
  icon: React.ElementType;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-lg bg-white p-10 rounded-xl shadow-lg border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 mx-auto text-slate-500">
          <Icon size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export default async function ContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Auth Check
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // 2. Fetch Team Profile
  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
    select: {
      display_name: true,
      // REMOVED: total_score
      category: true,
    },
  });

  if (!teamProfile) {
    redirect("/login");
  }

  // 3. Fetch The CORRECT Active Contest
  const contest = await prisma.contest.findFirst({
    where: {
      isActive: true,
      problems: {
        some: {
          category: teamProfile.category,
        },
      },
    },
    select: {
      id: true,
      endTime: true,
      startTime: true,
    },
  });

  const now = new Date();

  // --- STATE CHECK LOGIC ---
  if (!contest) {
    return (
      <ContestStatusScreen
        title="Contest Not Configured"
        message="No active competition found for your category. Please wait for the marshals to start the event."
        icon={CalendarOff}
      />
    );
  }

  if (now < contest.startTime) {
    const startTimeString = contest.startTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const startDateString = contest.startTime.toLocaleDateString();

    return (
      <ContestStatusScreen
        title="Contest Scheduled"
        message={`The competition starts at ${startTimeString} on ${startDateString}. This page will become active automatically then.`}
        icon={Clock}
      />
    );
  }

  if (now > contest.endTime) {
    return (
      <ContestStatusScreen
        title="Contest Ended"
        message="The submission window is now closed. Thank you for your participation! You may view the final results on the leaderboard."
        icon={AlertTriangle}
      />
    );
  }

  // State 4: Contest Is Live (Proceed to client rendering)
  return (
    <ContestLayoutClient
      teamName={teamProfile.display_name}
      teamScore={0} // <--- Score is now set to 0 (hidden)
      teamCategory={teamProfile.category}
      contestId={contest.id}
      contestEndTime={contest.endTime}
    >
      {children}
    </ContestLayoutClient>
  );
}
