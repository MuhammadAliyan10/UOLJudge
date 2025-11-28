import { prisma } from "@/lib/prisma";

/**
 * The "$Z$-Gate" Validator
 * Single source of truth for contest access control
 * 
 * Call this before EVERY submission attempt
 */
export async function validateContestAccess(contestId: string): Promise<{
    valid: boolean;
    reason?: string;
}> {
    try {
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
        });

        if (!contest) {
            return {
                valid: false,
                reason: "Contest not found.",
            };
        }

        const now = new Date();

        // 1. Check Pause State (Emergency Brake)
        if (contest.isPaused) {
            return {
                valid: false,
                reason: "Contest is currently PAUSED by Administrators.",
            };
        }

        // 2. Check Time Window - Before Start
        if (now < contest.startTime) {
            return {
                valid: false,
                reason: "Contest has not started yet.",
            };
        }

        // 3. Check Time Window - After End
        if (now > contest.endTime) {
            return {
                valid: false,
                reason: "Contest has ENDED.",
            };
        }

        // All checks passed
        return { valid: true };
    } catch (error) {
        console.error("Error validating contest access:", error);
        return {
            valid: false,
            reason: "Failed to validate contest access. Please try again.",
        };
    }
}

/**
 * Get current contest status
 * Used for UI display
 */
export async function getContestStatus(contestId: string): Promise<{
    status: "NOT_STARTED" | "LIVE" | "PAUSED" | "FROZEN" | "ENDED";
    isPaused: boolean;
    isFrozen: boolean;
    startTime: Date;
    endTime: Date;
    now: Date;
}> {
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
    });

    if (!contest) {
        throw new Error("Contest not found");
    }

    const now = new Date();

    let status: "NOT_STARTED" | "LIVE" | "PAUSED" | "FROZEN" | "ENDED" = "LIVE";

    if (now < contest.startTime) {
        status = "NOT_STARTED";
    } else if (now > contest.endTime) {
        status = "ENDED";
    } else if (contest.isPaused) {
        status = "PAUSED";
    } else if (contest.isFrozen) {
        status = "FROZEN";
    }

    return {
        status,
        isPaused: contest.isPaused,
        isFrozen: contest.isFrozen,
        startTime: contest.startTime,
        endTime: contest.endTime,
        now,
    };
}
