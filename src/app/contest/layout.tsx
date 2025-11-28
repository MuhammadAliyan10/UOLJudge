import { getSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { ContestLayoutClient } from './ContestLayoutClient';

export default async function ContestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    // Get team profile
    const teamProfile = await prisma.teamProfile.findUnique({
        where: { user_id: session.userId },
    });

    // Get active contest
    const contest = await prisma.contest.findFirst({
        where: {
            is_active: true,
        },
    });

    return (
        <ContestLayoutClient
            teamName={teamProfile?.display_name || 'Team'}
            teamScore={teamProfile?.total_score || 0}
            contestEndTime={contest?.end_time}
        >
            {children}
        </ContestLayoutClient>
    );
}
