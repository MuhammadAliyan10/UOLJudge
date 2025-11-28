"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// --- SCHEMAS (Validation Layer) ---

const CreateTeamSchema = z.object({
  displayName: z.string().min(1, "Team Name is required"),
  username: z.string().min(3, "Username must be at least 3 chars"),
  password: z.string().min(6, "Password must be at least 6 chars"),
  category: z.nativeEnum(Category),
  labLocation: z.string().optional(),
});

const UpdateTeamSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  username: z.string().min(3),
  password: z.string().optional(), // Optional password update
  category: z.nativeEnum(Category),
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
    category: formData.get("category"),
    labLocation: formData.get("labLocation"),
  };

  const result = CreateTeamSchema.safeParse(rawData);
  if (!result.success)
    return { success: false, error: result.error.errors[0].message };
  const data = result.data;

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Atomic Creation of User (Login) and TeamProfile (Metadata)
    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          username: data.username,
          password_hash: hashedPassword,
          role: "PARTICIPANT",
          team_profile: {
            create: {
              display_name: data.displayName,
              category: data.category,
              lab_location: data.labLocation || "Unknown",
            },
          },
        },
      });
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
    category: formData.get("category"),
    labLocation: formData.get("labLocation"),
    isActive: formData.get("isActive"),
  };

  const result = UpdateTeamSchema.safeParse(rawData);
  if (!result.success)
    return { success: false, error: result.error.errors[0].message };
  const data = result.data;

  try {
    const updateData: any = {
      username: data.username,
      is_active: data.isActive,
      team_profile: {
        update: {
          display_name: data.displayName,
          category: data.category,
          lab_location: data.labLocation,
        },
      },
    };

    // Only update password if a new one is typed (length check already done by Zod)
    if (data.password && data.password.length > 0) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    await db.user.update({
      where: { id: data.id },
      data: updateData,
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
      await tx.submission.deleteMany({ where: { user_id: teamId } });
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
    return { success: false, error: result.error.errors[0].message };
  const data = result.data;

  try {
    await db.$transaction(async (tx) => {
      const contest = await tx.contest.create({
        data: {
          name: data.name,
          start_time: new Date(data.startTime),
          end_time: new Date(data.endTime),
        },
      });

      // Automated generation of problem slots (A, B, C...)
      const problemsToCreate = Array.from({ length: data.problemCount }).map(
        (_, i) => ({
          title: `Problem ${String.fromCharCode(65 + i)}`,
          description: "Please refer to the physical question paper provided.",
          category: data.category,
          order_index: i,
          points: 100,
          contest_id: contest.id,
        })
      );

      await tx.problem.createMany({ data: problemsToCreate });
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to create contest" };
  }
}

export async function updateContestAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isActive: formData.get("isActive"),
  };

  const result = UpdateContestSchema.safeParse(rawData);
  if (!result.success) return { success: false, error: "Invalid Data" };
  const data = result.data;

  try {
    await db.contest.update({
      where: { id: data.id },
      data: {
        name: data.name,
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        is_active: data.isActive,
      },
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to update contest" };
  }
}

export async function deleteContestAction(contestId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    // Transactionally delete all related entities (Problems, Submissions)
    await db.$transaction(async (tx) => {
      // 1. Delete submissions related to problems in this contest
      const problems = await tx.problem.findMany({
        where: { contest_id: contestId },
        select: { id: true },
      });
      const problemIds = problems.map((p) => p.id);

      await tx.submission.deleteMany({
        where: { problem_id: { in: problemIds } },
      });

      // 2. Delete problems
      await tx.problem.deleteMany({ where: { contest_id: contestId } });

      // 3. Delete announcements
      await tx.announcement.deleteMany({ where: { contest_id: contestId } });

      // 4. Delete the contest itself
      await tx.contest.delete({ where: { id: contestId } });
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e: any) {
    if (e.code === "P2003") {
      // P2003 is Foreign Key Constraint error. This happens if ContestRegistration exists.
      return {
        success: false,
        error: "Cannot delete. Teams are still registered for this contest.",
      };
    }
    return { success: false, error: "Deletion failed." };
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
    const currentEndTime = new Date(contest.end_time);
    const newEndTime = new Date(
      currentEndTime.getTime() + minutesToAdd * 60000
    ); // Add minutes in milliseconds

    await db.contest.update({
      where: { id: contestId },
      data: {
        end_time: newEndTime,
        is_active: true, // Ensure it becomes active again if it was manually set to false
        // Optional: clear frozen_at time if a massive extension is granted
      },
    });

    // Revalidate the Contests list and the specific Leaderboard page
    revalidatePath("/admin/contests");
    revalidatePath(`/leaderboard/${contestId}`);

    return { success: true, newTime: newEndTime.toISOString() };
  } catch (e) {
    return { success: false, error: "Failed to extend contest time." };
  }
}
