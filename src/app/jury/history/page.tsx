import { getAllGradedSubmissions } from "@/server/actions/jury/jury-stats";
import { HistoryClient } from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
    const gradedSubmissions = await getAllGradedSubmissions();

    return <HistoryClient initialGradedSubmissions={gradedSubmissions} />;
}
