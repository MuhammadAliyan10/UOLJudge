import { notFound, redirect } from "next/navigation";
import { getSubmissionForGrading, getSubmissionGradingHistory } from "@/server/actions/jury";
import { GradingInterface } from "@/components/jury/GradingInterface";

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

        return (
            <GradingInterface
                submission={submission}
                history={history}
            />
        );
    } catch (error: any) {
        if (error.message?.includes("Access denied")) {
            redirect("/jury");
        }
        notFound();
    }
}
