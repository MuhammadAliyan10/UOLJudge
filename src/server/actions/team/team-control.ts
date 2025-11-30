"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Kill Switch: Real-Time Team Blocking
 * Toggles a team's blocked status and broadcasts the change via WebSocket
 */
export async function toggleTeamBlock(teamId: string) {
    const session = await getSession();
    if (session?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Get current team profile to toggle the status
        const teamProfile = await db.teamProfile.findUnique({
            where: { user_id: teamId },
            select: { is_blocked: true },
        });

        if (!teamProfile) {
            return { success: false, error: "Team not found" };
        }

        const newBlockedStatus = !teamProfile.is_blocked;

        // Update the team's blocked status
        await db.teamProfile.update({
            where: { user_id: teamId },
            data: { is_blocked: newBlockedStatus },
        });

        // Broadcast real-time update to Pulse Engine
        try {
            await fetch("http://localhost:3001/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "TEAM_STATUS_UPDATE",
                    payload: {
                        teamId: teamId,
                        isBlocked: newBlockedStatus,
                    }
                }),
            });
        } catch (broadcastError) {
            console.error("Failed to broadcast team block update:", broadcastError);
            // Continue even if broadcast fails - database update is more important
        }

        // Revalidate admin paths
        revalidatePath("/admin/teams");
        revalidatePath("/admin/grading");

        return {
            success: true,
            isBlocked: newBlockedStatus,
            message: newBlockedStatus ? "Team blocked successfully" : "Team unblocked successfully"
        };
    } catch (error: any) {
        console.error("Error toggling team block:", error);
        return { success: false, error: `Failed to toggle block status: ${error.message}` };
    }
}
