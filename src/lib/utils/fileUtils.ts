import path from 'path';
import crypto from 'crypto';
import { Category } from '@prisma/client';

// ============================================================
// FILE EXTENSION VALIDATION
// ============================================================

const ALLOWED_EXTENSIONS: Record<Category, string[]> = {
    CORE: ['.cpp', '.c', '.java', '.py'],
    WEB: ['.zip'],
    ANDROID: ['.apk'],
};

const LANGUAGE_MAP: Record<string, string> = {
    '.cpp': 'cpp',
    '.c': 'c',
    '.java': 'java',
    '.py': 'python',
    '.zip': 'web',
    '.apk': 'android',
};

/**
 * Validates if file extension is allowed for the given category
 */
export function validateFileExtension(
    filename: string,
    category: Category
): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS[category].includes(ext);
}

/**
 * Gets language identifier from file extension
 */
export function getLanguageFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    return LANGUAGE_MAP[ext] || 'unknown';
}

/**
 * Gets allowed extensions for a category as a string for UI display
 */
export function getAllowedExtensionsString(category: Category): string {
    return ALLOWED_EXTENSIONS[category].join(', ');
}

// ============================================================
// FILE HASHING
// ============================================================

/**
 * Generates SHA-256 hash of file buffer for integrity verification
 */
export function generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ============================================================
// STORAGE PATH GENERATION
// ============================================================

/**
 * Generates storage path for submission file
 * Format: storage/[contestId]/[teamId]/[problemId]/
 */
export function getStoragePath(
    contestId: string,
    teamId: string,
    problemId: string
): string {
    return path.join(process.cwd(), 'storage', contestId, teamId, problemId);
}

/**
 * Generates unique filename with timestamp
 */
export function generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    // Sanitize filename to prevent path traversal
    const safe = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${timestamp}_${safe}${ext}`;
}

/**
 * Check if file is binary (not text)
 */
export function isBinaryFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.zip', '.apk'].includes(ext);
}
