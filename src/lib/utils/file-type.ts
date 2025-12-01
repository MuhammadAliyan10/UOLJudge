/**
 * File Type Detection Utility
 * Determines whether a file is code (previewable) or binary (download-only)
 */

export type FileCategory = "code" | "binary";

export interface FileTypeInfo {
    category: FileCategory;
    language: string;
    icon: "code" | "archive" | "mobile";
}

const CODE_EXTENSIONS = ["cpp", "c", "py", "java", "js", "ts", "txt", "cs", "h", "hpp", "sh", "json", "xml", "html", "css"];
const ARCHIVE_EXTENSIONS = ["zip", "rar", "tar", "gz", "7z"];
const MOBILE_EXTENSIONS = ["apk", "ipa", "aab"];

export function getFileTypeInfo(fileExtension: string): FileTypeInfo {
    const ext = fileExtension.toLowerCase();

    // Check if it's code
    if (CODE_EXTENSIONS.includes(ext)) {
        return {
            category: "code",
            language: getLanguageName(ext),
            icon: "code",
        };
    }

    // Check if it's mobile app
    if (MOBILE_EXTENSIONS.includes(ext)) {
        return {
            category: "binary",
            language: ext.toUpperCase(),
            icon: "mobile",
        };
    }

    // Check if it's archive
    if (ARCHIVE_EXTENSIONS.includes(ext)) {
        return {
            category: "binary",
            language: ext.toUpperCase(),
            icon: "archive",
        };
    }

    // Default to binary for unknown types
    return {
        category: "binary",
        language: ext.toUpperCase(),
        icon: "archive",
    };
}

function getLanguageName(extension: string): string {
    const languageMap: Record<string, string> = {
        cpp: "cpp",
        c: "c",
        py: "python",
        java: "java",
        js: "javascript",
        ts: "typescript",
        cs: "csharp",
        h: "c",
        hpp: "cpp",
        sh: "bash",
        json: "json",
        xml: "xml",
        html: "html",
        css: "css",
        txt: "plaintext",
    };

    return languageMap[extension] || "plaintext";
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
