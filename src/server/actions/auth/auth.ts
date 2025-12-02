"use server"
import { redirect } from 'next/navigation';
import { createSession, deleteSession, getSession } from '@/lib/auth';
import { LoginSchema, type LoginInput } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

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

        // 5. Device Limit Enforcement (Only for PARTICIPANTS)
        let sessionId = crypto.randomUUID();

        if (user.role === 'PARTICIPANT' && user.team_profile) {
            const maxDevices = user.team_profile.max_devices || 2;
            const authorizedDevices = (user.team_profile.authorized_devices as any[]) || [];

            // Check if limit reached
            if (authorizedDevices.length >= maxDevices) {
                return {
                    success: false,
                    error: `Device limit exceeded. Maximum ${maxDevices} device(s) allowed for this team. Please logout from another device first.`,
                };
            }

            // Get User Agent for identification
            const headersList = await headers();
            const userAgent = headersList.get('user-agent') || 'Unknown Device';

            // Add new device session
            const newDevice = {
                sessionId,
                userAgent,
                loginTime: Date.now(),
            };

            await prisma.teamProfile.update({
                where: { id: user.team_profile.id },
                data: {
                    authorized_devices: [...authorizedDevices, newDevice],
                },
            });
        }

        // 6. Create session
        await createSession({
            userId: user.id,
            username: user.username,
            role: user.role,
            teamId: user.team_profile?.id,
            sessionId, // Store sessionId in cookie payload
        });

        revalidatePath('/');

        // 7. Return success with redirect path based on role
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
    // 1. Clean up device session from DB if Participant
    const session = await getSession();

    if (session && session.role === 'PARTICIPANT' && session.teamId && session.sessionId) {
        try {
            const teamProfile = await prisma.teamProfile.findUnique({
                where: { id: session.teamId },
                select: { authorized_devices: true },
            });

            if (teamProfile) {
                const currentDevices = (teamProfile.authorized_devices as any[]) || [];
                const updatedDevices = currentDevices.filter(
                    (d: any) => d.sessionId !== session.sessionId
                );

                await prisma.teamProfile.update({
                    where: { id: session.teamId },
                    data: {
                        authorized_devices: updatedDevices,
                    },
                });
            }
        } catch (error) {
            console.error('[LOGOUT] Failed to cleanup device session:', error);
            // Continue with logout anyway
        }
    }

    // 2. Destroy cookie
    await deleteSession();

    // CRITICAL: Clear Next.js cache to prevent stale admin page access
    revalidatePath('/', 'layout');

    redirect('/login');
}
