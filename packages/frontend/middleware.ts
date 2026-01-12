import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 */
const protectedRoutes = [
  '/dashboard',
  '/onboarding',
  '/campaigns/create',
  '/settings',
  '/messenger',
];

/**
 * Auth routes that authenticated users shouldn't access
 */
const authRoutes = ['/auth/login', '/auth/signup', '/auth'];

/**
 * Routes that allow donations require auth
 */
const donateRoutePattern = /^\/campaigns\/[^/]+\/donate$/;

/**
 * Middleware to protect routes based on authentication status
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get tokens from cookies or headers
  // IMPORTANT: Backend sets 'access_token' cookie (with underscore), not 'accessToken'
  const accessToken = request.cookies.get('access_token')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '');

  const isAuthenticated = !!accessToken;

  // Check if route is protected and user is not authenticated
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  ) || donateRoutePattern.test(pathname);

  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login with return URL
    const url = new URL('/auth', request.url);
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check if authenticated user is trying to access auth routes
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
