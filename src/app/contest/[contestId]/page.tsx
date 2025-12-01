import { redirect } from "next/navigation";

export default async function ContestIdPage({ params }: { params: Promise<{ contestId: string }> }) {
    const { contestId } = await params;
    // Redirect to problems page
    redirect(`/contest/${contestId}/problems`);
}
