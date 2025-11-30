import { getPendingSubmissions } from "@/server/actions/jury/jury-dashboard";
import { getRetryRequests } from "@/server/actions/submission/retry-system";
import { SubmissionsClient } from "./SubmissionsClient";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
    // Fetch data with error handling to prevent repeated auth errors in logs
    let pendingSubmissions: Awaited<ReturnType<typeof getPendingSubmissions>> = [];
    let retryRequests: Awaited<ReturnType<typeof getRetryRequests>> = [];

    try {
        [pendingSubmissions, retryRequests] = await Promise.all([
            getPendingSubmissions(),
            getRetryRequests(),
        ]);
    } catch (error) {
        // Silently handle - layout already does auth check
        console.error("Error loading submissions data:", error instanceof Error ? error.message : error);
    }

    return (
        <SubmissionsClient
            initialPendingSubmissions={pendingSubmissions}
            initialRetryRequests={retryRequests}
        />
    );
}
