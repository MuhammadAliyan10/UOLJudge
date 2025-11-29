"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const CreateJurySchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contestIds: z.array(z.string()).min(1, "At least one contest must be assigned"),
});

const UpdateJuryAssignmentsSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    contestIds: z.array(z.string()),
});

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ActionResponse {
    success: boolean;
    error?: string;
    message?: string;
}

interface JuryMember {
    id: string;
    username: string;
    created_at: Date;
    assignedContests: Array<{
        id: string;
        name: string;
        startTime: Date;
        endTime: Date;
    }>;
}

// ============================================================
// AUTHORIZATION GUARD
// ============================================================

async function requireAdmin(): Promise<ActionResponse | null> {
    const session = await getSession();
    if (!session || session.role !== UserRole.ADMIN) {
        return { success: false, error: "Unauthorized: Admin access required" };
    }
    return null;
}

// ============================================================
// JURY MANAGEMENT ACTIONS
// ============================================================

/**
 * Create Jury Member with Contest Assignments
 * 
 * Zero-Trust Implementation:
 * - Creates User with role: JURY
 * - Atomically creates JuryAssignment records for selected contests
 * - All operations in a single transaction
 */
export async function createJuryMemberAction(formData: FormData): Promise<ActionResponse> {
    // Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    // Parse and validate input
    const contestIdsRaw = formData.get("contestIds");
    const contestIds = contestIdsRaw ? JSON.parse(contestIdsRaw as string) : [];

    const rawData = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        contestIds,
    };

    const result = CreateJurySchema.safeParse(rawData);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    const data = result.data;

    try {
        // Verify all contests exist
        const contests = await prisma.contest.findMany({
            where: { id: { in: data.contestIds } },
            select: { id: true },
        });

        if (contests.length !== data.contestIds.length) {
            return { success: false, error: "One or more contests not found" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Atomic transaction: Create user + assignments
        await prisma.$transaction(async (tx) => {
            // 1. Create jury user
            const user = await tx.user.create({
                data: {
                    username: data.username,
                    password_hash: hashedPassword,
                    role: UserRole.JURY,
                },
            });

            // 2. Create jury assignments
            const assignmentData = data.contestIds.map((contestId) => ({
                userId: user.id,
                contestId: contestId,
            }));

            await tx.juryAssignment.createMany({
                data: assignmentData,
            });

            // 3. Log the action
            await tx.systemLog.create({
                data: {
                    action: "MANUAL_GRADE_UPDATE", // Using existing enum
                    level: "INFO",
                    message: `Created jury member: ${user.username}`,
                    details: `Assigned to ${data.contestIds.length} contest(s)`,
                    user_id: user.id,
                    metadata: {
                        contestIds: data.contestIds,
                        action: "CREATE_JURY",
                    },
                },
            });
        });

        revalidatePath("/admin/users/jury");
        return { success: true, message: "Jury member created successfully" };
    } catch (error: any) {
        console.error("Error creating jury member:", error);

        if (error.code === "P2002") {
            return { success: false, error: "Username already exists" };
        }

        return { success: false, error: "Failed to create jury member" };
    }
}

/**
 * Update Jury Contest Assignments
 * 
 * Zero-Trust Implementation:
 * - Verifies user has JURY role
 * - Replaces all assignments atomically
 * - Transaction ensures consistency
 */
export async function updateJuryAssignmentsAction(
    userId: string,
    contestIds: string[]
): Promise<ActionResponse> {
    // Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    // Validate input
    const result = UpdateJuryAssignmentsSchema.safeParse({ userId, contestIds });
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        // Verify user exists and has JURY role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, username: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        if (user.role !== UserRole.JURY) {
            return { success: false, error: "User is not a jury member" };
        }

        // Verify all contests exist
        if (contestIds.length > 0) {
            const contests = await prisma.contest.findMany({
                where: { id: { in: contestIds } },
                select: { id: true },
            });

            if (contests.length !== contestIds.length) {
                return { success: false, error: "One or more contests not found" };
            }
        }

        // Atomic transaction: Delete old + Create new assignments
        await prisma.$transaction(async (tx) => {
            // 1. Delete all existing assignments
            await tx.juryAssignment.deleteMany({
                where: { userId: userId },
            });

            // 2. Create new assignments if any
            if (contestIds.length > 0) {
                const assignmentData = contestIds.map((contestId: string) => ({
                    userId: userId,
                    contestId: contestId,
                }));

                await tx.juryAssignment.createMany({
                    data: assignmentData,
                });
            }

            // 3. Log the action
            await tx.systemLog.create({
                data: {
                    action: "MANUAL_GRADE_UPDATE",
                    level: "INFO",
                    message: `Updated jury assignments: ${user.username}`,
                    details: `Now assigned to ${contestIds.length} contest(s)`,
                    user_id: userId,
                    metadata: {
                        contestIds,
                        action: "UPDATE_JURY_ASSIGNMENTS",
                    },
                },
            });
        });

        revalidatePath("/admin/users/jury");
        return { success: true, message: "Assignments updated successfully" };
    } catch (error: any) {
        console.error("Error updating jury assignments:", error);
        return { success: false, error: "Failed to update assignments" };
    }
}

/**
 * Delete Jury Member
 * 
 * Zero-Trust Implementation:
 * - Verifies user has JURY role
 * - Cascade deletes JuryAssignment via schema
 */
export async function deleteJuryMemberAction(userId: string): Promise<ActionResponse> {
    // Authorization check
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        // Verify user exists and has JURY role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, username: true },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        if (user.role !== UserRole.JURY) {
            return { success: false, error: "User is not a jury member" };
        }

        // Delete user (JuryAssignments cascade via schema)
        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath("/admin/users/jury");
        return { success: true, message: "Jury member deleted successfully" };
    } catch (error: any) {
        console.error("Error deleting jury member:", error);
        return { success: false, error: "Failed to delete jury member" };
    }
}

/**
 * Get All Jury Members with Their Assignments
 * 
 * Returns formatted data for admin UI table
 */
export async function getJuryMembersWithAssignments(): Promise<JuryMember[]> {
    const session = await getSession();
    if (!session || session.role !== UserRole.ADMIN) {
        return [];
    }

    try {
        const juryMembers = await prisma.user.findMany({
            where: { role: UserRole.JURY },
            select: {
                id: true,
                username: true,
                created_at: true,
                jury_assignments: {
                    select: {
                        contest: {
                            select: {
                                id: true,
                                name: true,
                                startTime: true,
                                endTime: true,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        return juryMembers.map((member) => ({
            id: member.id,
            username: member.username,
            created_at: member.created_at,
            assignedContests: member.jury_assignments.map((assignment) => assignment.contest),
        }));
    } catch (error) {
        console.error("Error fetching jury members:", error);
        return [];
    }
}

/**
 * Get All Active Contests (for assignment dropdown)
 */
export async function getAllContestsForAssignment(): Promise<Array<{ id: string; name: string }>> {
    const session = await getSession();
    if (!session || session.role !== UserRole.ADMIN) {
        return [];
    }

    try {
        const contests = await prisma.contest.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { startTime: "desc" },
        });

        return contests;
    } catch (error) {
        console.error("Error fetching contests:", error);
        return [];
    }
}
