import { NextRequest, NextResponse } from 'next/server';
import { decrypt, updateSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

const PUBLIC_ROUTES = ['/', '/login'];
const ADMIN_ROUTES = ['/admin'];
const JURY_ROUTES = ['/jury'];
const CONTEST_ROUTES = ['/contest'];

// ============================================================
// MIDDLEWARE LOGIC
// ============================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // 1. Get session from cookie
    const sessionCookie = request.cookies.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    // 2. Check if route is public
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // 3. Handle unauthenticated users
    if (!session) {
        // Allow access to public routes
        if (isPublicRoute) {
            return NextResponse.next();
        }

        // Determine if the route is protected
        const isAdminRoute = ADMIN_ROUTES.some((route) =>
            pathname.startsWith(route)
        );
        const isJuryRoute = JURY_ROUTES.some((route) =>
            pathname.startsWith(route)
        );
        const isContestRoute = CONTEST_ROUTES.some((route) =>
            pathname.startsWith(route)
        );

        // If no session and trying to access a protected route, redirect to login with cache control
        if (isAdminRoute || isJuryRoute || isContestRoute) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            const response = NextResponse.redirect(loginUrl);
            // SECURITY: Prevent caching of protected pages
            response.headers.set('Cache-Control', 'no-store, must-revalidate');
            return response;
        }

        // For any other non-public route, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. User is authenticated - redirect away from login page
    if (pathname === '/login') {
        let dashboardUrl: URL;

        // Zero-Trust: Each role has exactly ONE designated area
        if (session.role === UserRole.ADMIN) {
            dashboardUrl = new URL('/admin', request.url);
        } else if (session.role === UserRole.JURY) {
            dashboardUrl = new URL('/jury', request.url);
        } else {
            dashboardUrl = new URL('/contest', request.url);
        }

        return NextResponse.redirect(dashboardUrl);
    }

    // 5. Role-based access control (ZERO-TRUST ENFORCEMENT)
    const isAdminRoute = ADMIN_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isJuryRoute = JURY_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isContestRoute = CONTEST_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    // RULE: ADMIN can ONLY access /admin/*
    if (session.role === UserRole.ADMIN) {
        if (!isAdminRoute && !isPublicRoute) {
            const forbiddenUrl = new URL('/admin', request.url);
            return NextResponse.redirect(forbiddenUrl);
        }
    }

    // RULE: JURY can ONLY access /jury/*
    if (session.role === UserRole.JURY) {
        if (!isJuryRoute && !isPublicRoute) {
            const forbiddenUrl = new URL('/jury', request.url);
            return NextResponse.redirect(forbiddenUrl);
        }
    }

    // RULE: PARTICIPANT can ONLY access /contest/*
    if (session.role === UserRole.PARTICIPANT) {
        if (!isContestRoute && !isPublicRoute) {
            const forbiddenUrl = new URL('/contest', request.url);
            return NextResponse.redirect(forbiddenUrl);
        }
    }

    // 6. Refresh session (sliding window expiration)
    return await updateSession(request);
}

// ============================================================
// MATCHER CONFIGURATION
// ============================================================

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt (metadata)
         * - public folder files (assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
    ],
};
