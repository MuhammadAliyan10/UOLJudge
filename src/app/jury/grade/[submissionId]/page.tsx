import { notFound, redirect } from "next/navigation";
import { getSubmissionForGrading, getSubmissionGradingHistory, getCurrentJuryUsername } from "@/server/actions/jury/jury-dashboard";
import { GradingInterface } from "@/features/jury/components/GradingInterface";

export const dynamic = "force-dynamic";

interface GradingPageProps {
    params: {
        submissionId: string;
    };
}

export default async function GradingPage({ params }: GradingPageProps) {
    // Next.js 15+ requires awaiting params
    const { submissionId } = await params;

    try {
        const submission = await getSubmissionForGrading(submissionId);
        const history = await getSubmissionGradingHistory(submissionId);
        const currentJuryUsername = await getCurrentJuryUsername();

        return (
            <GradingInterface
                submission={submission}
                history={history}
                currentJuryUsername={currentJuryUsername}
            />
        );
    } catch (error: any) {
        if (error.message?.includes("Access denied")) {
            redirect("/jury");
        }
        notFound();
    }
}
