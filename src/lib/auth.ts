import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db as prisma } from './db';
import { UserRole } from '@prisma/client';

// ============================================================
// TYPES & CONFIGURATION
// ============================================================

const SECRET_KEY = process.env.JWT_SECRET || 'secret_dev_key_do_not_use_prod';
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
    userId: string;
    username: string;
    role: UserRole;
    teamId?: string; // Only for PARTICIPANTS
    iat?: number;
    exp?: number;
    [key: string]: unknown; // Index signature for JWT compatibility
}

export interface LoginResult {
    success: boolean;
    error?: string;
    redirectTo?: string;
}

// ============================================================
// JWT UTILITIES
// ============================================================

/**
 * Encrypts session payload into JWT token
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Default: 24 hours
        .sign(key);
}

/**
 * Decrypts and validates JWT token
 */
export async function decrypt(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload as SessionPayload;
    } catch (error) {
        // Invalid or expired token
        return null;
    }
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Creates a new session cookie
 */
export async function createSession(payload: SessionPayload): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const token = await encrypt(payload);

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
    });
}

/**
 * Gets current session from cookies (Server Component)
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) return null;
    return await decrypt(session);
}

/**
 * Deletes session cookie (logout)
 */
export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

/**
 * Updates session expiration in middleware (session refresh)
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
    const session = request.cookies.get('session')?.value;

    if (!session) {
        return NextResponse.next();
    }

    // Decrypt and validate
    const parsed = await decrypt(session);

    if (!parsed) {
        // Invalid session - clear cookie
        const response = NextResponse.next();
        response.cookies.delete('session');
        return response;
    }

    // Refresh session expiration (sliding window)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const refreshedToken = await encrypt(parsed);

    const response = NextResponse.next();
    response.cookies.set({
        name: 'session',
        value: refreshedToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
    });

    return response;
}

// ============================================================
// AUTHENTICATION LOGIC (The "Iron Gate")
// ============================================================

/**
 * Validates user credentials and creates session
 */
export async function login(
    username: string,
    password: string
): Promise<LoginResult> {
    try {
        // 1. Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                team_profile: true,
            },
        });

        if (!user) {
            return {
                success: false,
                error: 'Invalid username or password',
            };
        }

        // 2. Check if account is active
        if (!user.is_active) {
            return {
                success: false,
                error: 'account_inactive',
            };
        }

        // 3. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return {
                success: false,
                error: 'Invalid username or password',
            };
        }

        // 4. Create session payload
        const sessionPayload: SessionPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            teamId: user.team_profile?.id,
        };

        // 5. Create session cookie
        await createSession(sessionPayload);

        // 6. Determine redirect based on role
        const redirectTo =
            user.role === 'PARTICIPANT' ? '/contest' : '/admin';

        return {
            success: true,
            redirectTo,
        };
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred',
        };
    }
}

/**
 * Logs out the current user
 */
export async function logout(): Promise<void> {
    await deleteSession();
}
