import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompletedContests } from "@/server/actions/admin/ceremony";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const contests = await getCompletedContests();

  return <ResultsClient contests={contests} />;
}
