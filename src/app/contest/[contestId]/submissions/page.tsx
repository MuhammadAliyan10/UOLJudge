import { getSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SubmissionsWebSocketListener } from "@/features/contest/components/SubmissionsWebSocketListener";
import { SubmissionsTableClient } from "./SubmissionsTableClient";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  // 1. Auth Check
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { contestId } = await params;

  // 2. Fetch Data (Filtered by Contest)
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.userId,
      problem: {
        contestId: contestId,
      },
    },
    include: { problem: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <>
      {/* Real-time WebSocket Listener */}
      <SubmissionsWebSocketListener />

      {/* Client Component for Table */}
      <SubmissionsTableClient submissions={submissions} />
    </>
  );
}
