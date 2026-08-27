import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth-page/login',
    '/auth-page/register',
    '/auth-page/forgot-password',
    '/auth-page/reset-password',
    '/auth-page/verify',
  ];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    // If user is already authenticated and tries to access auth pages, redirect to dashboard
    if (token && (pathname.startsWith('/auth-page') && !pathname.includes('/verify'))) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          return NextResponse.redirect(new URL('/UserDashboard/dashboard', request.url));
        }
      } catch (error) {
        // Invalid token, continue to public route
      }
    }
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (!token) {
    return NextResponse.redirect(new URL('/auth-page/login', request.url));
  }

  // Verify token
  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL('/auth-page/login', request.url));
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/auth-page/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - api/auth routes (public API routes)
     * - api/deriv routes (OAuth callback routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/deriv).*)',
  ],
};