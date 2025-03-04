// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from './lib/types/supabase';
import { protectedRoutes, adminRoutes } from './routes';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the pathname from the URL
  const path = req.nextUrl.pathname;

  // Check if the user is trying to access a protected route
  if (!session) {
    // User is not authenticated
    
    // Check protected routes that require login
    if (protectedRoutes.some((route) => path.startsWith(route.path))) {
      // Get the matched route for proper redirection
      const matchedRoute = protectedRoutes.find((route) => path.startsWith(route.path));
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = matchedRoute?.redirect || '/login'; // Default to /login
      redirectUrl.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin routes (no need to check if user is admin since not even logged in)
    if (adminRoutes.some((route) => path.startsWith(route.path))) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // User is authenticated but check if they're authorized for admin routes
    const isAdmin = 
      session.user?.app_metadata?.admin === true || 
      session.user?.user_metadata?.is_admin === true || 
      session.user?.user_metadata?.is_super_admin === true;

    // Check admin access
    if (!isAdmin && adminRoutes.some((route) => path.startsWith(route.path))) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/devices'; // Redirect to devices page instead of login
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Add session user to request for use in API routes or server components
  // This is needed in case you want to access the session in API routes
  req.headers.set('x-session-user', session?.user?.id || '');

  return res;
}

export const config = {
  matcher: [
    // Match all request paths except for:
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    // Optional: Add any API routes you want to exclude from middleware
    // '/(api(?!/auth).*)' 
  ],
};