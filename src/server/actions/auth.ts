'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/lib/auth';
import { LoginSchema, type LoginInput } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// ============================================================
// AUTHENTICATION ACTIONS
// ============================================================

export interface ActionResponse<T = void> {
    success: boolean;
    error?: string;
    data?: T;
}

/**
 * Server action for user login
 */
export async function loginAction(
    username: string,
    password: string
): Promise<ActionResponse<{ redirectTo: string }>> {
    try {
        // 1. Validate input with Zod
        const validation = LoginSchema.safeParse({ username, password });

        if (!validation.success) {
            return {
                success: false,
                error: validation.error.issues[0]?.message || 'Invalid input',
            };
        }

        // 2. Find user in database
        const user = await prisma.user.findUnique({
            where: { username },
            include: { team_profile: true },
        });

        if (!user) {
            return { success: false, error: 'Invalid username or password' };
        }

        // 3. Verify password
        const passwordValid = await bcrypt.compare(password, user.password_hash);

        if (!passwordValid) {
            return { success: false, error: 'Invalid username or password' };
        }

        // 4. Check if user is active
        if (!user.is_active) {
            return {
                success: false,
                error: 'Your account has been deactivated. Contact administrator.',
            };
        }

        // 5. Create session
        await createSession({
            userId: user.id,
            username: user.username,
            role: user.role,
            teamId: user.team_profile?.id,
        });

        revalidatePath('/');

        // 6. Return success with redirect path based on role
        let redirectTo = '/contest'; // Default for PARTICIPANT

        if (user.role === 'ADMIN') {
            redirectTo = '/admin';
        } else if (user.role === 'JURY') {
            redirectTo = '/jury';
        }

        return {
            success: true,
            data: { redirectTo },
        };
    } catch (error) {
        console.error('[AUTH_ACTION] Login error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}

/**
 * Logout action - destroys session and clears cache
 */
export async function logoutAction(): Promise<void> {
    await deleteSession();

    // CRITICAL: Clear Next.js cache to prevent stale admin page access
    revalidatePath('/', 'layout');

    redirect('/login');
}
