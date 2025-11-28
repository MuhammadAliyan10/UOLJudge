import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ContestLayoutClient } from "./ContestLayoutClient";

export default async function ContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Authenticate
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // 2. Fetch Team Profile (Need Category for UI)
  const teamProfile = await prisma.teamProfile.findUnique({
    where: { user_id: session.userId },
    select: {
      display_name: true,
      total_score: true,
      category: true, // <--- CRITICAL
    },
  });

  if (!teamProfile) redirect("/login");

  // 3. Fetch Active Contest (Need ID for Leaderboard Link)
  const contest = await prisma.contest.findFirst({
    where: { is_active: true },
    select: {
      id: true,
      end_time: true,
    },
  });

  return (
    <ContestLayoutClient
      teamName={teamProfile.display_name}
      teamScore={teamProfile.total_score}
      teamCategory={teamProfile.category} // <--- Pass Category
      contestId={contest?.id} // <--- Pass ID
      contestEndTime={contest?.end_time}
    >
      {children}
    </ContestLayoutClient>
  );
}
