import { NextRequest, NextResponse } from 'next/server';
import { decrypt, updateSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// ============================================================
// ROUTE CONFIGURATION
// ============================================================

const PUBLIC_ROUTES = ['/', '/login'];
const ADMIN_ROUTES = ['/admin'];
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

        // Determine if the route is an admin or contest route (protected)
        const isAdminRoute = ADMIN_ROUTES.some((route) =>
            pathname.startsWith(route)
        );
        const isContestRoute = CONTEST_ROUTES.some((route) =>
            pathname.startsWith(route)
        );

        // If no session and trying to access a protected route, redirect to login with cache control
        if (isAdminRoute || isContestRoute) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            const response = NextResponse.redirect(loginUrl);
            // SECURITY: Prevent caching of protected pages
            response.headers.set('Cache-Control', 'no-store, must-revalidate');
            return response;
        }

        // For any other non-public, non-admin/contest route (e.g., a future protected route), redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. User is authenticated - redirect away from login page
    if (pathname === '/login') {
        const dashboardUrl = new URL(
            session.role === 'PARTICIPANT' ? '/contest' : '/admin',
            request.url
        );
        return NextResponse.redirect(dashboardUrl);
    }

    // 5. Role-based access control
    const isAdminRoute = ADMIN_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isContestRoute = CONTEST_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    // ADMIN and JURY can access admin routes
    if (isAdminRoute) {
        if (session.role !== UserRole.ADMIN && session.role !== UserRole.JURY) {
            const forbiddenUrl = new URL('/contest', request.url);
            return NextResponse.redirect(forbiddenUrl);
        }
    }

    // Only PARTICIPANT can access contest routes
    if (isContestRoute) {
        if (session.role !== UserRole.PARTICIPANT) {
            const forbiddenUrl = new URL('/admin', request.url);
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
