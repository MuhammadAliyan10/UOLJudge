import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Auto-redirect to assigned contest
 * This ensures teams always go to /contest/[their-contestId]/problems
 * instead of generic /contest/problems
 */
export default async function ContestRedirectPage() {
  // 1. Authenticate
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // 2. Fetch Team Profile with assigned contest
  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
    select: {
      assigned_contest_id: true,
    },
  });

  if (!teamProfile) {
    redirect("/login");
  }

  // 3. Redirect to assigned contest
  if (teamProfile.assigned_contest_id) {
    redirect(`/contest/${teamProfile.assigned_contest_id}/problems`);
  }

  // 4. No contest assigned - show error or redirect to homepage
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white border border-orange-200 rounded-lg p-8 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Contest Assigned</h2>
        <p className="text-slate-600 mb-6">
          Your team has not been assigned to a contest yet. Please contact the administrators.
        </p>
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
}
