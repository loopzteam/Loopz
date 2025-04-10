/**
 * ACTIVE MIDDLEWARE FILE
 * 
 * This is the primary middleware that handles authentication routing.
 * It redirects unauthenticated users from protected routes to /auth
 * and redirects authenticated users from /auth to /dashboard.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Helper function to log only in development mode
function devLog(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, ...args);
  }
}

// Helper function to log errors (always logged regardless of environment)
function errorLog(message: string, ...args: any[]) {
  console.error(message, ...args);
}

export async function middleware(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const pathname = request.nextUrl.pathname;
  const reqId = Math.random().toString(36).substring(2, 10); // For tracking request through logs
  
  devLog(`🔥🔥🔥 MIDDLEWARE [${timestamp}] RUNNING FOR: ${pathname}`);
  
  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.js') ||
    pathname.includes('.css')
  ) {
    return NextResponse.next();
  }
  
  // Log URL parameters for debugging
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  devLog(`🔥 MIDDLEWARE [${reqId}]: URL params:`, params);
  
  // Explicit force clear check (from our logout function)
  if (params.clear === 'true' && pathname.startsWith('/auth')) {
    devLog(`🔥 MIDDLEWARE [${reqId}]: Force clear detected, skipping session check`);
    return NextResponse.next();
  }
  
  // Log the cookies being received for debugging auth issues
  const allCookies = Array.from(request.cookies.getAll());
  const authCookies = allCookies.filter(cookie => 
    cookie.name.includes('sb-') || 
    cookie.name.includes('supabase') ||
    cookie.name === '__session' ||
    cookie.name === 'auth'
  );
  
  devLog(`🔥 MIDDLEWARE [${reqId}]: Total cookies: ${allCookies.length}, Auth cookies: ${authCookies.length}`);
  
  if (authCookies.length > 0) {
    devLog(`🔥 MIDDLEWARE [${reqId}]: Auth cookies:`, 
      authCookies.map(c => `${c.name}: ${c.value.substring(0, 10)}...`));
  } else {
    devLog(`🔥 MIDDLEWARE [${reqId}]: No auth cookies found`);
  }
  
  // Create a response object that we'll use both for cookies and returning
  const response = NextResponse.next();
  
  try {
    // Create a Supabase client that can read/set cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)?.value;
            devLog(`🔥 MIDDLEWARE [${reqId}]: Reading cookie: ${name} = ${cookie ? 'found' : 'not found'}`);
            return cookie;
          },
          set(name: string, value: string, options: any) {
            devLog(`🔥 MIDDLEWARE [${reqId}]: Setting cookie: ${name}`);
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            devLog(`🔥 MIDDLEWARE [${reqId}]: Removing cookie: ${name}`);
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    // Define protected and auth routes
    const protectedRoutes = ['/dashboard', '/profile', '/loop', '/tasks'];
    const authRoutes = ['/auth', '/login'];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    
    // Get the session - make sure it's fresh
    devLog(`🔥 MIDDLEWARE [${reqId}]: Fetching session...`);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      errorLog(`🔥 MIDDLEWARE [${reqId}]: Session error:`, sessionError);
      // On session error for protected routes, redirect to auth
      if (isProtectedRoute) {
        devLog(`🔥 MIDDLEWARE [${reqId}]: Redirecting to /auth due to session error`);
        return NextResponse.redirect(new URL(`/auth?t=${Date.now()}&err=session`, request.url));
      }
      return response;
    }
    
    // Enhanced session debugging
    if (session) {
      // Detailed session inspection
      if (process.env.NODE_ENV !== 'production') {
        devLog(`🔥 MIDDLEWARE [${reqId}]: Session details:`, {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role,
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
          createdAt: new Date(session.user.created_at || Date.now()).toISOString(),
          lastActiveTime: new Date(session.user.last_sign_in_at || Date.now()).toISOString(),
          accessToken: session.access_token ? `${session.access_token.substring(0, 10)}...` : 'none',
          refreshToken: session.refresh_token ? 'present' : 'none',
          tokenType: session.token_type,
          currentTimestamp: new Date().toISOString(),
        });
      }
      
      // Log if the session is expired but still returned
      if (session.expires_at) {
        const expiryTime = new Date(session.expires_at * 1000);
        const now = new Date();
        if (expiryTime < now) {
          errorLog(`🔥 MIDDLEWARE [${reqId}]: ⚠️ Session is expired but still returned by Supabase!`,
            { expired: expiryTime.toISOString(), now: now.toISOString() }
          );
        }
      }
    } else {
      devLog(`🔥 MIDDLEWARE [${reqId}]: No session found`);
      
      // Additional check - log all headers to see if auth tokens exist but weren't processed
      if (process.env.NODE_ENV !== 'production') {
        const authHeaders = Array.from(request.headers.entries())
          .filter(([key]) => key.toLowerCase().includes('auth') || key.toLowerCase().includes('token'));
        
        if (authHeaders.length > 0) {
          devLog(`🔥 MIDDLEWARE [${reqId}]: Auth-related headers found:`, authHeaders);
        }
      }
    }
    
    // Authentication logic
    if (session) {
      // User is signed in
      if (isAuthRoute) {
        // Redirect from auth pages to dashboard
        devLog(`🔥 MIDDLEWARE [${reqId}]: Already authenticated: Redirecting to /dashboard`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // No session/user is not signed in
      if (isProtectedRoute) {
        // Redirect to auth from protected routes
        devLog(`🔥 MIDDLEWARE [${reqId}]: Access denied: Redirecting to /auth`);
        return NextResponse.redirect(new URL(`/auth?t=${Date.now()}&from=${pathname}`, request.url));
      }
    }
    
    return response;
  } catch (error) {
    errorLog(`🔥 MIDDLEWARE [${reqId}]: Error:`, error);
    
    // On error for protected routes, redirect to auth
    if (['/dashboard', '/profile', '/loop', '/tasks'].some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(`/auth?t=${Date.now()}&err=exception`, request.url));
    }
    
    return response;
  }
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/',
  ],
};