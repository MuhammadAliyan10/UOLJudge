"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { Category } from "@prisma/client";
import { broadcastToWebSocket } from "@/lib/ws-broadcast-client";

// --- SCHEMA ---
const CreateProblemSchema = z.object({
  contestId: z.string(),
  title: z.string().min(1, "Title is required"),
  points: z.coerce.number().min(1).default(100),
  category: z.nativeEnum(Category),
  mode: z.enum(["PAPER", "PDF"]),
  // File is validated manually
});

export async function createProblemAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  const rawData = {
    contestId: formData.get("contestId"),
    title: formData.get("title"),
    points: formData.get("points"),
    category: formData.get("category"),
    mode: formData.get("mode"),
  };

  const result = CreateProblemSchema.safeParse(rawData);
  if (!result.success)
    return { success: false, error: result.error.issues[0].message };
  const data = result.data;

  let assetsPath: string | null = null;
  let description = "Please refer to the physical question paper.";

  // --- PDF HANDLING ---
  if (data.mode === "PDF") {
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return {
        success: false,
        error: "PDF file is required for Softcopy mode",
      };
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return { success: false, error: "Only PDF files are allowed" };
    }

    // Save File
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "storage", "problems");
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${data.contestId}_${Math.floor(
      Math.random() * 1000
    )}.pdf`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    assetsPath = filepath;
    description = "Click the button below to download the problem statement.";
  }

  try {
    // Determine the next order index (A, B, C...)
    const lastProblem = await db.problem.findFirst({
      where: { contestId: data.contestId },
      orderBy: { orderIndex: "desc" },
    });
    const nextIndex = (lastProblem?.orderIndex ?? -1) + 1;

    const newProblem = await db.problem.create({
      data: {
        title: data.title,
        description: description,
        points: data.points,
        category: data.category,
        contestId: data.contestId,
        orderIndex: nextIndex,
        type: data.mode === "PDF" ? "DIGITAL" : "PHYSICAL",
        assetsPath: assetsPath,
      },
    });

    // Update contentUrl with the problemId after creation
    if (assetsPath) {
      await db.problem.update({
        where: { id: newProblem.id },
        data: {
          contentUrl: `/api/problems/assets/${newProblem.id}`,
        },
      });
    }

    // Broadcast real-time update via WebSocket
    await broadcastToWebSocket('CONTEST_UPDATE', {
      action: 'problem_create',
      contestId: data.contestId
    });

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Database Error" };
  }
}

export async function deleteProblemAction(problemId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    const problem = await db.problem.findUnique({ where: { id: problemId } });

    if (problem?.assetsPath) {
      try {
        await fs.unlink(problem.assetsPath);
      } catch (e) { } // Ignore file delete error
    }

    const contestId = problem?.contestId;
    await db.problem.delete({ where: { id: problemId } });

    // Broadcast real-time update via WebSocket
    if (contestId) {
      await broadcastToWebSocket('CONTEST_UPDATE', {
        action: 'problem_delete',
        contestId
      });
    }

    revalidatePath("/admin/contests");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete problem" };
  }
}
