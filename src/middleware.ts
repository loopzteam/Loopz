import { NextResponse, type NextRequest } from "next/server";
// import { createMiddlewareClient } from '@/lib/supabase/middleware' // Using @ path alias
import { createMiddlewareClient } from "../lib/supabase/middleware"; // Using relative path

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient(req, res);

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // OPTIONAL: this prevents users from visiting
  // certain pages if they are logged in
  // if (session && req.nextUrl.pathname === '/login') {
  //   return NextResponse.redirect(new URL('/dashboard', req.url))
  // }

  // OPTIONAL: this prevents users from visiting
  // certain pages if they are not logged in
  // if (!session && req.nextUrl.pathname !== '/login') {
  //   return NextResponse.redirect(new URL('/login', req.url))
  // }

  return res;
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*) ",
  ],
};
