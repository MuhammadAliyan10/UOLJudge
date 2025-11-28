"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Category } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// --- SCHEMAS ---

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
  password: z.string().optional(),
  category: z.nativeEnum(Category),
  labLocation: z.string().optional(),
  isActive: z.string().transform((val) => val === "true"),
});

const CreateContestSchema = z.object({
  name: z.string().min(1, "Contest Name is required"),
  startTime: z.string(),
  endTime: z.string(),
  problemCount: z.number().min(1).max(15).default(5),
  category: z.nativeEnum(Category),
});

const UpdateContestSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.string().transform((val) => val === "true"),
});

// --- TEAM ACTIONS ---

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
    return { success: false, error: "Database Error" };
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

    if (data.password && data.password.length >= 6) {
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
    // Delete profile and user. Submissions should ideally be deleted or cascade.
    // We use a transaction to ensure clean up.
    await db.$transaction(async (tx) => {
      await tx.submission.deleteMany({ where: { user_id: teamId } }); // Clean submissions first
      await tx.teamProfile.delete({ where: { user_id: teamId } });
      await tx.user.delete({ where: { id: teamId } });
    });

    revalidatePath("/admin/teams");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete team" };
  }
}

// --- CONTEST ACTIONS ---

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
    // Dangerous operation: Cleaning up a contest
    await db.$transaction(async (tx) => {
      // 1. Delete all problems linked to contest
      // (Prisma might handle this via cascade if configured, but explicit is safer here)
      const problems = await tx.problem.findMany({
        where: { contest_id: contestId },
      });
      const problemIds = problems.map((p) => p.id);

      // 2. Delete submissions for those problems
      await tx.submission.deleteMany({
        where: { problem_id: { in: problemIds } },
      });

      // 3. Delete problems
      await tx.problem.deleteMany({ where: { contest_id: contestId } });

      // 4. Delete contest
      await tx.contest.delete({ where: { id: contestId } });
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete contest" };
  }
}
