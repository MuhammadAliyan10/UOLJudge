"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { broadcastToWebSocket } from "@/lib/ws-broadcast-client";

// --- SCHEMAS (Validation Layer) ---

const CreateTeamSchema = z.object({
  displayName: z.string().min(1, "Team Name is required"),
  username: z.string().min(3, "Username must be at least 3 chars"),
  password: z.string().min(6, "Password must be at least 6 chars"),
  contestId: z.string().min(1, "Contest assignment is required"),
  labLocation: z.string().optional(),
});

const UpdateTeamSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  username: z.string().min(3),
  password: z.string().optional(), // Optional password update
  contestId: z.string().min(1, "Contest assignment is required"),
  labLocation: z.string().optional(),
  isActive: z.string().transform((val) => val === "true"), // Handles boolean string from form
});

const CreateContestSchema = z.object({
  name: z.string().min(1, "Contest Name is required"),
  startTime: z.string(),
  endTime: z.string(),
  problemCount: z.coerce.number().min(1).max(15).default(5), // Coerce number from string/form data
  category: z.nativeEnum(Category),
});

const UpdateContestSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.string().transform((val) => val === "true"),
});

// -------------------------------------------------------------
// --- TEAM ACTIONS (CREATE, UPDATE, DELETE) ---
// -------------------------------------------------------------

export async function createTeamAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  const rawData = {
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    password: formData.get("password"),
    contestId: formData.get("contestId"),
    labLocation: formData.get("labLocation"),
  };

  const result = CreateTeamSchema.safeParse(rawData);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };
  const data = result.data;

  try {
    // Fetch contest to derive category
    const contest = await db.contest.findUnique({
      where: { id: data.contestId },
      include: {
        problems: {
          select: { category: true },
          take: 1,
        },
      },
    });

    if (!contest) {
      return { success: false, error: "Contest not found" };
    }

    // Derive category from contest's first problem (they should all be same category)
    const category = contest.problems[0]?.category || "CORE";
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Atomic Creation of User, TeamProfile, and ContestRegistration
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          password_hash: hashedPassword,
          role: "PARTICIPANT",
          team_profile: {
            create: {
              display_name: data.displayName,
              category: category,
              lab_location: data.labLocation || "Unknown",
              assigned_contest_id: data.contestId,
            },
          },
        },
      });

      // Create Contest Registration to link team to contest
      await tx.contestRegistration.create({
        data: {
          user_id: user.id,
          contest_id: data.contestId,
        },
      });
    });

    // Broadcast real-time update via WebSocket
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'team_create',
      contestId: data.contestId
    });

    revalidatePath("/admin/teams");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002")
      return { success: false, error: "Username already taken" };
    return { success: false, error: `Database Error: ${error.message}` };
  }
}

export async function updateTeamAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  const rawData = {
    id: formData.get("id"),
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    password: formData.get("password") || undefined,
    contestId: formData.get("contestId"),
    labLocation: formData.get("labLocation"),
    isActive: formData.get("isActive"),
  };

  const result = UpdateTeamSchema.safeParse(rawData);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };
  const data = result.data;

  try {
    // Fetch contest to derive category
    const contest = await db.contest.findUnique({
      where: { id: data.contestId },
      include: {
        problems: {
          select: { category: true },
          take: 1,
        },
      },
    });

    if (!contest) {
      return { success: false, error: "Contest not found" };
    }

    // Get current team profile to check if contest changed
    const currentProfile = await db.teamProfile.findUnique({
      where: { user_id: data.id },
      select: { assigned_contest_id: true },
    });

    // Derive category from contest's first problem
    const category = contest.problems[0]?.category || "CORE";

    const updateData: any = {
      username: data.username,
      is_active: data.isActive,
      team_profile: {
        update: {
          display_name: data.displayName,
          category: category,
          lab_location: data.labLocation,
          assigned_contest_id: data.contestId,
        },
      },
    };

    // Only update password if a new one is typed
    if (data.password && data.password.length > 0) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    await db.$transaction(async (tx) => {
      // Update user and team profile
      await tx.user.update({
        where: { id: data.id },
        data: updateData,
      });

      // Handle ContestRegistration if contest changed
      if (currentProfile?.assigned_contest_id !== data.contestId) {
        // Delete old registration if exists
        if (currentProfile?.assigned_contest_id) {
          await tx.contestRegistration.deleteMany({
            where: {
              user_id: data.id,
              contest_id: currentProfile.assigned_contest_id,
            },
          });
        }

        // Create new registration
        await tx.contestRegistration.create({
          data: {
            user_id: data.id,
            contest_id: data.contestId,
          },
        });
      }
    });

    // Broadcast real-time update via WebSocket
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'team_update',
      contestId: data.contestId,
      teamId: data.id
    });

    revalidatePath("/admin/teams");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to update team" };
  }
}

export async function deleteTeamAction(teamId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    // Transactionally delete all associated data first to avoid FK constraints
    await db.$transaction(async (tx) => {
      // 1. Clean submissions (required because submissions FK User and Problem)
      await tx.submission.deleteMany({ where: { userId: teamId } });
      // 2. Delete team profile (FK to User)
      await tx.teamProfile.delete({ where: { user_id: teamId } });
      // 3. Delete user account (Login)
      await tx.user.delete({ where: { id: teamId } });
    });

    revalidatePath("/admin/teams");
    return { success: true };
  } catch (e) {
    // P2003 usually means a forgotten FK constraint (e.g., still referenced somewhere else)
    return {
      success: false,
      error:
        "Deletion failed. Ensure no system dependencies remain (e.g., active registrations).",
    };
  }
}

// -------------------------------------------------------------
// --- CONTEST ACTIONS (CREATE, UPDATE, DELETE) ---
// -------------------------------------------------------------

export async function createContestAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  const rawData = {
    name: formData.get("name"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    problemCount: parseInt(formData.get("problemCount") as string),
    category: formData.get("category"),
  };

  const result = CreateContestSchema.safeParse(rawData);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };
  const data = result.data;

  try {
    let createdContestId = '';

    await db.$transaction(async (tx) => {
      const contest = await tx.contest.create({
        data: {
          name: data.name,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
        },
      });

      createdContestId = contest.id;

      // Automated generation of problem slots (A, B, C...)
      const problemsToCreate = Array.from({ length: data.problemCount }).map(
        (_, i) => ({
          title: `Problem ${String.fromCharCode(65 + i)}`,
          description: "Please refer to the physical question paper provided.",
          category: data.category,
          orderIndex: i,
          points: 100,
          contestId: contest.id,
        })
      );

      await tx.problem.createMany({ data: problemsToCreate });
    });

    // Broadcast real-time update via WebSocket
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'create',
      contestId: createdContestId
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to create contest" };
  }
}

export async function updateContestAction(input: FormData | { id: string;[key: string]: any }) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  let contestId: string;
  let updates: any = {};

  if (input instanceof FormData) {
    contestId = input.get("id") as string;
    updates = {
      name: input.get("name"),
      startTime: input.get("startTime"),
      endTime: input.get("endTime"),
      isActive: input.get("isActive") === "true",
    };
  } else {
    // Object input for partial updates (like toggle status)
    contestId = input.id;
    if (input.name !== undefined) updates.name = input.name;
    if (input.startTime !== undefined) updates.startTime = input.startTime;
    if (input.endTime !== undefined) updates.endTime = input.endTime;
    if (input.is_active !== undefined) updates.isActive = input.is_active;
    if (input.isActive !== undefined) updates.isActive = input.isActive;
  }

  try {
    // Fetch existing contest to merge with updates
    const existingContest = await db.contest.findUnique({
      where: { id: contestId },
    });

    if (!existingContest) {
      return { success: false, error: "Contest not found" };
    }

    // Build update data
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.startTime !== undefined) updateData.startTime = new Date(updates.startTime);
    if (updates.endTime !== undefined) updateData.endTime = new Date(updates.endTime);
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await db.contest.update({
      where: { id: contestId },
      data: updateData,
    });

    // Broadcast real-time update via WebSocket
    console.log('[updateContestAction] Broadcasting CONTEST_UPDATE for:', contestId);
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'update',
      contestId
    });
    console.log('[updateContestAction] Broadcast sent');

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    console.error('[updateContestAction] Error:', e);
    return { success: false, error: "Failed to update contest" };
  }
}

export async function deleteContestAction(contestId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    // Check if contest is currently running and has teams
    const contest = await db.contest.findUnique({
      where: { id: contestId },
      select: {
        startTime: true,
        endTime: true,
        isActive: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!contest) {
      return { success: false, error: "Contest not found" };
    }

    const now = new Date();
    const hasEnded = now > contest.endTime;
    const teamCount = contest._count.registrations;

    // ENHANCED LOGIC: Allow deletion if contest has ended (archival cleanup)
    // Block deletion only if: teams exist AND contest hasn't ended yet
    if (teamCount > 0 && !hasEnded) {
      return {
        success: false,
        error: "Cannot delete contest with registered teams unless it has ended. Please wait until the contest ends for archival cleanup.",
      };
    }

    // Check if currently running (extra safety)
    const isRunning = contest.isActive &&
      now >= contest.startTime &&
      now <= contest.endTime;

    if (isRunning) {
      return {
        success: false,
        error: "Cannot delete a running contest. Please wait until it ends or deactivate it first."
      };
    }

    // Transactionally delete all related entities
    await db.$transaction(async (tx) => {
      // 1. Delete submissions related to problems in this contest
      const problems = await tx.problem.findMany({
        where: { contestId: contestId },
        select: { id: true },
      });
      const problemIds = problems.map((p) => p.id);

      await tx.submission.deleteMany({
        where: { problemId: { in: problemIds } },
      });

      // 2. Delete contest registrations (teams)
      await tx.contestRegistration.deleteMany({
        where: { contest_id: contestId },
      });

      // 3. Delete jury assignments
      await tx.juryAssignment.deleteMany({
        where: { contestId: contestId },
      });

      // 4. Delete team scores for teams in this contest
      await tx.teamScore.deleteMany({
        where: {
          team: {
            assigned_contest_id: contestId,
          },
        },
      });

      // 5. Delete problems
      await tx.problem.deleteMany({ where: { contestId: contestId } });

      // 6. Delete announcements
      await tx.announcement.deleteMany({ where: { contest_id: contestId } });

      // 7. Delete system logs related to this contest
      await tx.systemLog.deleteMany({
        where: {
          metadata: {
            path: ["contestId"],
            equals: contestId,
          },
        },
      });

      // 8. Delete the contest itself
      await tx.contest.delete({ where: { id: contestId } });
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e: any) {
    console.error("Contest deletion error:", e);
    return { success: false, error: `Deletion failed: ${e.message}` };
  }
}

export async function extendContestTime(
  contestId: string,
  minutesToAdd: number
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    const contest = await db.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return { success: false, error: "Contest not found." };
    }

    // Determine the current effective end time (either the past time, or the future time)
    const currentEndTime = new Date(contest.endTime);
    const newEndTime = new Date(
      currentEndTime.getTime() + minutesToAdd * 60000
    ); // Add minutes in milliseconds

    await db.contest.update({
      where: { id: contestId },
      data: {
        endTime: newEndTime,
        isActive: true, // Ensure it becomes active again if it was manually set to false
        // Optional: clear frozen_at time if a massive extension is granted
      },
    });

    // Broadcast real-time update via WebSocket
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'time_extended',
      contestId
    });

    // Revalidate the Contests list and the specific Leaderboard page
    revalidatePath("/admin/contests");
    revalidatePath(`/leaderboard/${contestId}`);

    return { success: true, newTime: newEndTime.toISOString() };
  } catch (e) {
    return { success: false, error: "Failed to extend contest time." };
  }
}

/**
 * Toggle Contest Freeze (Leaderboard Freeze)
 * Freezes or unfreezes the leaderboard by setting/clearing frozenAt timestamp
 */
export async function toggleContestFreezeAction(
  contestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (session?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Get current freeze status
    const contest = await db.contest.findUnique({
      where: { id: contestId },
      select: { frozenAt: true },
    });

    if (!contest) {
      return { success: false, error: "Contest not found" };
    }

    const isCurrentlyFrozen = contest.frozenAt !== null;

    // Toggle: If frozen, unfreeze (null). If not frozen, freeze (now in UTC)
    await db.contest.update({
      where: { id: contestId },
      data: {
        frozenAt: isCurrentlyFrozen ? null : new Date() // UTC timestamp
      },
    });

    // Broadcast real-time update via WebSocket
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'freeze_toggle',
      contestId,
      frozen: !isCurrentlyFrozen
    });

    revalidatePath("/admin/contests");
    revalidatePath(`/leaderboard/${contestId}`);

    return { success: true };
  } catch (error) {
    console.error("Error toggling contest freeze:", error);
    return { success: false, error: "Failed to toggle freeze status" };
  }
}
