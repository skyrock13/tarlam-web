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

  if (
    !session &&
    protectedRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route.path),
    )
  ) {
    const matchedRoute = protectedRoutes.find((route) =>
      req.nextUrl.pathname.startsWith(route.path),
    );
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = matchedRoute?.redirect || '/login'; // Fallback to /login
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isAdmin = session?.user?.app_metadata?.admin === true;

  if (
    !session &&
    adminRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route.path),
    )
  ) {
    const matchedRoute = adminRoutes.find((route) =>
      req.nextUrl.pathname.startsWith(route.path),
    );
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = matchedRoute?.redirect || '/login'; // Fallback to /login
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};