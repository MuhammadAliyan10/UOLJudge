"use server";

import { prisma } from "@/lib/prisma";
import { broadcastContestUpdate } from "@/lib/ws-broadcast";

export async function createAnnouncement(
    contestId: string,
    title: string,
    message: string,
    type: "INFO" | "WARNING" | "CRITICAL" = "INFO"
) {
    try {
        const announcement = await prisma.announcement.create({
            data: {
                contest_id: contestId,
                title,
                message,
            }
        });

        // Broadcast to ALL connected clients
        await broadcastContestUpdate("ANNOUNCEMENT", {
            title,
            message,
            type,
            contestId
        });

        return { success: true, message: "Announcement broadcasted successfully." };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { success: false, message: "Failed to broadcast announcement." };
    }
}
