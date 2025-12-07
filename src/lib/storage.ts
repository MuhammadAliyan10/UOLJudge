import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Local File Storage Engine
 * Saves files to ./public/uploads/[contestSlug]/[teamName]/
 */

// Use environment variable for flexible deployment, fallback to /app/storage
const UPLOADS_BASE_DIR = process.env.UPLOAD_DIR || "/app/storage";

/**
 * Ensure directory exists, create if not
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Generate unique filename with timestamp
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${timestamp}_${sanitizedName}`;
}

/**
 * Calculate file hash for deduplication/verification
 */
function calculateHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Save file to local disk
 *
 * @param file - The File object from FormData
 * @param contestSlug - Contest identifier
 * @param teamName - Team identifier
 * @returns Relative path to the saved file (from public directory)
 */
export async function saveFile(
  file: File,
  contestSlug: string,
  teamName: string
): Promise<{ filePath: string; fileHash: string }> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate hash
    const fileHash = calculateHash(buffer);

    // Sanitize directory names
    const sanitizedContestSlug = contestSlug.replace(/[^a-zA-Z0-9-]/g, "_");
    const sanitizedTeamName = teamName.replace(/[^a-zA-Z0-9-]/g, "_");

    // Ensure directory exists: ./public/uploads/[contestSlug]/[teamName]/
    const targetDir = path.join(
      UPLOADS_BASE_DIR,
      sanitizedContestSlug,
      sanitizedTeamName
    );
    await ensureDir(targetDir);

    // Generate unique filename
    const filename = generateFilename(file.name);
    const fullPath = path.join(targetDir, filename);

    // Write file
    await fs.writeFile(fullPath, buffer);

    // Return relative path (from storage directory)
    const relativePath = path.join(
      sanitizedContestSlug,
      sanitizedTeamName,
      filename
    );

    return {
      filePath: relativePath,
      fileHash,
    };
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Failed to save file to disk");
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Validate file type based on category - SECURITY AUDIT V4.0
 *
 * CORE: Single-file source code only (NO archives/binaries)
 * WEB/ANDROID: Archives and packages only
 */
export function validateFileType(fileType: string, category: string): boolean {
  const normalizedType = fileType.toLowerCase();

  const allowedTypes: Record<string, string[]> = {
    // CORE: Source code files ONLY - NO archives, NO binaries
    CORE: [
      // C/C++ variants
      "c",
      "cpp",
      "cc",
      "cxx",
      // Python
      "py",
      // Java
      "java",
      // C#
      "cs",
      // JavaScript/TypeScript
      "js",
      "ts",
      // Go
      "go",
      // Rust
      "rs",
      // Kotlin
      "kt",
      // Swift
      "swift",
      // Plain text (for algorithm descriptions)
      "txt",
    ],
    // WEB: Archive files
    WEB: ["zip", "rar", "7z", "tar", "gz", "tgz"],
    // ANDROID: APK/AAB + Archives
    ANDROID: ["apk", "aab", "zip", "rar", "7z", "tar", "gz"],
  };

  const allowed = allowedTypes[category] || [];
  const isAllowed = allowed.includes(normalizedType);

  // SECURITY: Explicit rejection of binary/executable files for CORE
  if (category === "CORE") {
    const bannedBinaryExtensions = [
      "exe",
      "dll",
      "so",
      "dylib",
      "bin",
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
    ];
    if (bannedBinaryExtensions.includes(normalizedType)) {
      return false; // REJECT binaries/archives for CORE
    }
  }

  return isAllowed;
}
