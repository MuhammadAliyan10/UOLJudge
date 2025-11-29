import { getAssignedContests, getPendingSubmissions } from "@/server/actions/jury";
import JuryDashboardClient from "./JuryDashboardClient";

export const dynamic = "force-dynamic";

export default async function JuryDashboard() {
    const contests = await getAssignedContests();
    const pendingSubmissions = await getPendingSubmissions();

    return (
        <JuryDashboardClient
            initialContests={contests}
            initialPendingSubmissions={pendingSubmissions}
        />
    );
}
