"use server";

import { db as prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Ensure the user is an admin
async function ensureAdmin() {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required");
    }
}

// Get a system setting by key (Public access for maintenance mode, etc.)
export async function getSystemSetting(key: string) {
    const setting = await prisma.systemSetting.findUnique({
        where: { key },
    });

    return setting?.value || null;
}

// Update or create a system setting
export async function updateSystemSetting(key: string, value: string) {
    await ensureAdmin();

    await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });

    // FEATURE: ANNOUNCEMENT BROADCAST VIA WEBSOCKET
    if (key === "GLOBAL_ANNOUNCEMENT" && value.trim().length > 0) {
        const { broadcastContestUpdate } = await import("@/lib/ws-broadcast");
        await broadcastContestUpdate("ANNOUNCEMENT", { message: value });
    }

    revalidatePath("/admin/settings");
    return { success: true };
}

// Purge all system logs (DANGER ZONE)
export async function purgeSystemLogs() {
    await ensureAdmin();

    await prisma.systemLog.deleteMany({});

    revalidatePath("/admin/logs");
    return { success: true, message: "All system logs have been purged" };
}

// Get all system settings as an object
export async function getAllSystemSettings() {
    await ensureAdmin();

    const settings = await prisma.systemSetting.findMany();

    const settingsObj: Record<string, string> = {};
    for (const setting of settings) {
        settingsObj[setting.key] = setting.value;
    }

    return settingsObj;
}
