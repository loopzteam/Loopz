import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createMiddlewareClient({ req: request, res: response });

  try {
    // Get session data. 
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(`[${timestamp}] Middleware Session Error: ${sessionError.message}`);
      return response; // Allow request on session error
    }

    let hasValidSession = !!session; // Initial check

    // ** Re-add Session Validation Check using getUser() **
    if (session) {
      // console.log(`[${timestamp}] Middleware: Found session object for ${pathname}, validating with getUser()...`);
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError || !user) {
        // Session might exist in cookie but is invalid/expired according to Supabase
        console.log(`[${timestamp}] Middleware: Session validation failed (getUser error or no user). Forcing logout for ${pathname}.`);
        hasValidSession = false;
        // Attempt to force clear cookies in the response before redirecting
        const options = { path: '/', maxAge: 0 };
        response.cookies.set('sb-access-token', '', options);
        response.cookies.set('sb-refresh-token', '', options);
         const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.split('//')[1];
         if(projectRef) {
             response.cookies.set(`sb-${projectRef}-auth-token`, '', options);
         }
        // Redirect immediately as session is confirmed invalid
        return NextResponse.redirect(new URL('/auth', request.url));
      } 
      // else {
      //   console.log(`[${timestamp}] Middleware: Session validation successful for user ${user.id} on ${pathname}.`);
      // }
    }
    // Log the *final* validity status AFTER the getUser check
    console.log(`[${timestamp}] Middleware Check Final: Pathname: ${pathname}, Session Valid: ${hasValidSession}`);

    // Define Routes
    const protectedRoutes = ['/dashboard', '/profile', '/tasks']; 
    const authRoutes = ['/auth']; 

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isOnAuthPage = authRoutes.includes(pathname); 

    // Routing Logic using the validated session status
    if (isProtectedRoute && !hasValidSession) {
      console.log(`[${timestamp}] Middleware Redirect: No valid session on protected route ${pathname}. Redirecting to /auth.`);
      return NextResponse.redirect(new URL('/auth', request.url)); 
    }

    if (isOnAuthPage && hasValidSession) {
      console.log(`[${timestamp}] Middleware Redirect: Valid session found on auth route ${pathname}. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow request if no redirect needed
    return response;

  } catch (error) {
    console.error(`[${timestamp}] Middleware Unexpected Error: ${error instanceof Error ? error.message : String(error)} for path ${pathname}`);
    return response; // Allow request cautiously on unexpected errors
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
     * - images (static images folder)
     * Exclude the debug route as well
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
    '/', 
  ],
}; 