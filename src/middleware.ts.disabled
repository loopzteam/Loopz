import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Cache-busting headers for development
const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Surrogate-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function middleware(req: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔒 Middleware: ${req.nextUrl.pathname}`);
  
  // Create a response early to modify headers
  const res = NextResponse.next();
  
  try {
    // In development, prevent caching
    if (process.env.NODE_ENV === 'development') {
      Object.entries(CACHE_CONTROL_HEADERS).forEach(([key, value]) => {
        res.headers.set(key, value);
      });
    }

    const supabase = createMiddlewareClient(req, res);
    
    // Always get a fresh session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error(`[${timestamp}] ❌ Session error:`, sessionError);
      return redirectToAuth(req);
    }

    const hasSession = !!session;
    console.log(`[${timestamp}] 📝 Session check: ${hasSession ? 'Found' : 'Not found'}`);
    
    // If there's a session, validate it with getUser
    let isValidSession = false;
    if (hasSession) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        isValidSession = !!user && !userError;
        console.log(`[${timestamp}] 🔑 Session validation: ${isValidSession ? 'Valid' : 'Invalid'}`);
      } catch (e) {
        console.error(`[${timestamp}] ❌ User validation error:`, e);
        isValidSession = false;
      }
    }

    // Define protected and auth routes
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth') || req.nextUrl.pathname === '/login';

    // Strict routing logic
    if (isProtectedRoute && !isValidSession) {
      console.log(`[${timestamp}] 🚫 Access denied: Redirecting to /auth`);
      return redirectToAuth(req);
    }

    if (isAuthRoute && isValidSession) {
      console.log(`[${timestamp}] ✅ Already authenticated: Redirecting to /dashboard`);
      return redirectToDashboard(req);
    }

    return res;
  } catch (error) {
    console.error(`[${timestamp}] 💥 Unexpected error:`, error);
    // On error, fail safe by redirecting to auth
    return redirectToAuth(req);
  }
}

// Helper functions for consistent redirects
function redirectToAuth(req: NextRequest) {
  const redirectUrl = new URL('/auth', req.url);
  redirectUrl.searchParams.set('t', Date.now().toString());
  return NextResponse.redirect(redirectUrl);
}

function redirectToDashboard(req: NextRequest) {
  return NextResponse.redirect(new URL('/dashboard', req.url));
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

