import { z } from 'zod';

// ============================================================
// AUTHENTICATION SCHEMAS
// ============================================================

export const LoginSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username too long'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password too long'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================================
// FUTURE SCHEMAS (Phase 2+)
// ============================================================

// Submission Schema
export const SubmissionSchema = z.object({
    problemId: z.string().uuid(),
    file: z.custom<File>((val) => val instanceof File, 'File is required'),
    language: z.string().optional(),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

// ============================================================
// SUBMISSION VALIDATION (Phase 3)
// ============================================================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const SubmissionFormSchema = z.object({
    problemId: z.string().uuid('Invalid problem ID'),
    file: z.custom<File>((val) => val instanceof File, 'File is required'),
}).refine(
    (data) => {
        return data.file.size <= MAX_FILE_SIZE;
    },
    {
        message: `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        path: ['file'],
    }
);

export type SubmissionFormInput = z.infer<typeof SubmissionFormSchema>;


// Clarification Schema
export const ClarificationSchema = z.object({
    problemId: z.string().uuid().optional(),
    question: z
        .string()
        .min(10, 'Question must be at least 10 characters')
        .max(1000, 'Question too long'),
});

export type ClarificationInput = z.infer<typeof ClarificationSchema>;
