"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// ============================================================
// TYPES & SCHEMAS
// ============================================================

export interface BulkImportResult {
    success: boolean;
    credentials?: TeamCredential[];
    errors?: string[];
    successCount?: number;
    failureCount?: number;
}

export interface TeamCredential {
    teamName: string;
    username: string;
    password: string;
    category: string;
    members: string[];
}

interface ParsedTeam {
    teamName: string;
    category: Category;
    member1: string;
    member2: string;
}

const CsvRowSchema = z.object({
    teamName: z.string().min(1, "Team name is required"),
    category: z.enum(["CORE", "WEB", "ANDROID"], {
        message: "Category must be CORE, WEB, or ANDROID",
    }),
    member1: z.string().min(1, "Member 1 name is required"),
    member2: z.string().min(1, "Member 2 name is required"),
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate a random alphanumeric suffix for usernames
 * @param length - Length of the random suffix (default: 4)
 * @returns Random alphanumeric string
 */
function generateRandomSuffix(length: number = 4): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a random password
 * @param length - Length of the password (default: 6)
 * @returns Random alphanumeric password
 */
function generateRandomPassword(length: number = 6): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Parse CSV content into validated team objects
 * Expected format: TeamName,Category,Member1Name,Member2Name
 * @param csvContent - Raw CSV string
 * @returns Array of parsed teams with any errors encountered
 */
function parseCsvToTeams(csvContent: string): {
    teams: ParsedTeam[];
    errors: string[];
} {
    const lines = csvContent.trim().split("\n");
    const teams: ParsedTeam[] = [];
    const errors: string[] = [];

    // Skip header row if it exists
    const startIndex = lines[0]?.toLowerCase().includes("teamname") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const parts = line.split(",").map((part) => part.trim());

        if (parts.length < 4) {
            errors.push(
                `Row ${i + 1}: Invalid format. Expected: TeamName,Category,Member1,Member2`
            );
            continue;
        }

        const [teamName, category, member1, member2] = parts;

        const validation = CsvRowSchema.safeParse({
            teamName,
            category: category.toUpperCase(),
            member1,
            member2,
        });

        if (!validation.success) {
            errors.push(
                `Row ${i + 1}: ${validation.error.issues.map((e) => e.message).join(", ")}`
            );
            continue;
        }

        teams.push(validation.data);
    }

    return { teams, errors };
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

/**
 * Bulk import teams from CSV content
 * Creates User, TeamProfile, ContestRegistration, and TeamScore atomically per team
 * 
 * @param contestId - Contest ID to register teams for
 * @param csvContent - CSV string with format: TeamName,Category,Member1Name,Member2Name
 * @returns Result with generated credentials or errors
 */
export async function bulkImportTeams(
    contestId: string,
    csvContent: string
): Promise<BulkImportResult> {
    try {
        // 1. Auth check
        const session = await getSession();
        if (session?.role !== "ADMIN") {
            return { success: false, errors: ["Unauthorized"] };
        }

        // 2. Validate contest exists
        const contest = await db.contest.findUnique({
            where: { id: contestId },
        });

        if (!contest) {
            return { success: false, errors: ["Contest not found"] };
        }

        // 3. Parse CSV
        const { teams, errors: parseErrors } = parseCsvToTeams(csvContent);

        if (teams.length === 0) {
            return {
                success: false,
                errors: [
                    "No valid teams found in CSV",
                    ...parseErrors,
                ],
            };
        }

        // 4. Process each team
        const credentials: TeamCredential[] = [];
        const errors: string[] = [...parseErrors];
        let successCount = 0;
        let failureCount = 0;

        for (const team of teams) {
            try {
                // Generate credentials
                const categoryPrefix = team.category.toLowerCase();
                const username = `team_${categoryPrefix}_${generateRandomSuffix(4)}`;
                const password = generateRandomPassword(6);
                const passwordHash = await bcrypt.hash(password, 10);

                // Atomic transaction for this team
                await db.$transaction(async (tx) => {
                    // 1. Create User (Team Leader account)
                    const user = await tx.user.create({
                        data: {
                            username,
                            password_hash: passwordHash,
                            role: "PARTICIPANT",
                        },
                    });

                    // 2. Create TeamProfile
                    const teamProfile = await tx.teamProfile.create({
                        data: {
                            user_id: user.id,
                            display_name: team.teamName,
                            category: team.category,
                            members: [team.member1, team.member2], // Store as JSON array
                            lab_location: "TBD", // Can be updated later
                            assigned_contest_id: contestId,
                        },
                    });

                    // 3. Create ContestRegistration
                    await tx.contestRegistration.create({
                        data: {
                            user_id: user.id,
                            contest_id: contestId,
                        },
                    });

                    // 4. Initialize TeamScore
                    await tx.teamScore.create({
                        data: {
                            teamId: teamProfile.id,
                            solvedCount: 0,
                            totalPenalty: 0,
                            problemStats: {},
                        },
                    });
                });

                // Store credentials
                credentials.push({
                    teamName: team.teamName,
                    username,
                    password,
                    category: team.category,
                    members: [team.member1, team.member2],
                });

                successCount++;
            } catch (error: any) {
                failureCount++;
                const errorMsg =
                    error.code === "P2002"
                        ? `Team "${team.teamName}": Username collision (retry or use different data)`
                        : `Team "${team.teamName}": ${error.message || "Unknown error"}`;
                errors.push(errorMsg);
            }
        }

        // 5. Revalidate the teams page
        revalidatePath("/admin/teams");

        return {
            success: successCount > 0,
            credentials,
            errors: errors.length > 0 ? errors : undefined,
            successCount,
            failureCount,
        };
    } catch (error: any) {
        console.error("[BULK_IMPORT] Fatal error:", error);
        return {
            success: false,
            errors: [error.message || "Failed to process bulk import"],
        };
    }
}
