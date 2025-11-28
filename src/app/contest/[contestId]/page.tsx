import { redirect } from "next/navigation";

export default function ContestIdPage({ params }: { params: { contestId: string } }) {
    // Redirect to problems page
    redirect(`/contest/${params.contestId}/problems`);
}
