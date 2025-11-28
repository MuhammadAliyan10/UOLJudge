import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { ProblemsClient } from './ProblemsClient';

export default async function ProblemsPage() {
    // 1. Get authenticated session
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    // 2. Get team profile
    const teamProfile = await prisma.teamProfile.findUnique({
        where: { user_id: session.userId },
    });

    if (!teamProfile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Team Profile Not Found
                    </h2>
                    <p className="text-slate-400">
                        Please contact an administrator.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Get active contest
    const contest = await prisma.contest.findFirst({
        where: {
            is_active: true,
            start_time: { lte: new Date() },
            end_time: { gte: new Date() },
        },
        include: {
            problems: {
                where: { category: teamProfile.category }, // CATEGORY FILTER
                orderBy: { order_index: 'asc' },
            },
        },
    });

    if (!contest) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        No Active Contest
                    </h2>
                    <p className="text-slate-400">
                        There are no contests running at the moment.
                    </p>
                </div>
            </div>
        );
    }

    // 4. Get user's submissions for status badges
    const submissions = await prisma.submission.findMany({
        where: {
            user_id: session.userId,
            problem_id: { in: contest.problems.map((p) => p.id) },
        },
        orderBy: { submitted_at: 'desc' },
        distinct: ['problem_id'],
    });

    const submissionMap = new Map(
        submissions.map((s) => [s.problem_id, s.verdict])
    );

    return (
        <ProblemsClient
            problems={contest.problems}
            submissionMap={Object.fromEntries(submissionMap)}
            teamCategory={teamProfile.category}
            contestEndTime={contest.end_time}
        />
    );
}
