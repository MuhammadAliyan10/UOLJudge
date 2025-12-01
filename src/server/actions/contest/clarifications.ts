"use server";

import { prisma } from "@/lib/prisma";
import { broadcastContestUpdate } from "@/lib/ws-broadcast";

export async function requestClarification(
    userId: string,
    contestId: string,
    problemId: string | null,
    question: string
) {
    try {
        const clarification = await prisma.clarification.create({
            data: {
                user_id: userId,
                problem_id: problemId,
                question,
                answer: null,
            },
            include: {
                user: {
                    include: {
                        team_profile: true,
                    }
                },
                problem: true,
            }
        });

        // Notify Jury
        // We don't have a specific JURY_UPDATE event for clarifications yet, 
        // but we can reuse JURY_QUEUE_UPDATE or create a new one.
        // For now, let's assume Juries listen to 'CLARIFICATION_REQUEST' or similar.
        // But based on useContestSocket, we haven't added CLARIFICATION_REQUEST.
        // Let's just use ADMIN_UPDATE for now as Juries are admins/juries.

        await broadcastContestUpdate("ADMIN_UPDATE", {
            action: "NEW_CLARIFICATION",
            clarificationId: clarification.id,
            teamName: clarification.user.team_profile?.display_name || "Unknown Team",
            question: clarification.question,
        });

        return { success: true, message: "Clarification requested successfully." };
    } catch (error) {
        console.error("Error requesting clarification:", error);
        return { success: false, message: "Failed to request clarification." };
    }
}

export async function getClarifications(userId: string, contestId: string) {
    try {
        // Get clarifications asked by this user OR public clarifications for this contest
        // Note: Prisma schema doesn't link Clarification directly to Contest, 
        // but via Problem -> Contest. Or if problem_id is null, it's general.
        // We need to filter by contest.

        // This is a bit tricky without direct contest_id on Clarification.
        // Assuming clarifications are relevant if they are for problems in this contest
        // OR if they are general (problem_id null) and created during contest time?
        // For simplicity, let's fetch all for the user, and public ones for the contest's problems.

        const clarifications = await prisma.clarification.findMany({
            where: {
                OR: [
                    { user_id: userId }, // My questions
                    {
                        // Public answers for problems in this contest
                        problem: {
                            contestId: contestId
                        },
                        answer: { not: null } // Only if answered? Or maybe we want to show public questions too? 
                        // Usually only answered ones are public.
                        // But wait, schema doesn't have isPublic flag. 
                        // Let's assume if it's answered and not specific to user... 
                        // Actually, standard ICPC: You see YOUR questions, and GLOBAL announcements.
                        // Clarifications are usually private unless made public.
                        // Let's just return USER's questions for now as per "Hotline" feature.
                    }
                ]
            },
            include: {
                problem: true,
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return { success: true, data: clarifications };
    } catch (error) {
        console.error("Error fetching clarifications:", error);
        return { success: false, data: [] };
    }
}
