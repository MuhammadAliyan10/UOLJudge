import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ContestLayoutClient } from "./ContestLayoutClient";
import { AlertTriangle, Clock, CalendarOff } from "lucide-react"; // Added icons for display

// --- Helper Component for Inactive/Scheduled States (Rendered by Server) ---
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
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
    select: {
      display_name: true,
      total_score: true,
      category: true,
    },
  });

  if (!teamProfile) {
    redirect("/login");
  }

  // Fetch the CORRECT Contest details
  const contest = await prisma.contest.findFirst({
    where: {
      is_active: true,
      problems: {
        some: {
          category: teamProfile.category,
        },
      },
    },
    select: {
      id: true,
      end_time: true,
      start_time: true, // <--- CRITICAL: Need start time for check
      name: true, // Optional: for display purposes
    },
  });

  const now = new Date();

  // --- STATE CHECK LOGIC ---

  // State 1: No Contest Found (Setup Error)
  if (!contest) {
    return (
      <ContestStatusScreen
        title="Contest Not Configured"
        message="No active competition found for your category. Please wait for the marshals to start the event."
        icon={CalendarOff}
      />
    );
  }

  // State 2: Contest Is Scheduled but Not Started
  if (now < contest.start_time) {
    const startTimeString = contest.start_time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const startDateString = contest.start_time.toLocaleDateString();

    return (
      <ContestStatusScreen
        title="Contest Scheduled"
        message={`The competition starts at ${startTimeString} on ${startDateString}. This page will become active automatically then.`}
        icon={Clock}
      />
    );
  }

  // State 3: Contest Ended
  if (now > contest.end_time) {
    return (
      <ContestStatusScreen
        title="Contest Ended"
        message="The submission window is now closed. Thank you for participating! Check the leaderboard for final results."
        icon={AlertTriangle}
      />
    );
  }

  // State 4: Contest Is Live (Proceed to client rendering)
  return (
    <ContestLayoutClient
      teamName={teamProfile.display_name}
      teamScore={teamProfile.total_score}
      teamCategory={teamProfile.category}
      contestId={contest.id}
      contestEndTime={contest.end_time}
    >
      {children}
    </ContestLayoutClient>
  );
}
