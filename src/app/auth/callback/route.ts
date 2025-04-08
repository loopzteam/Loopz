import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Route handler for GET requests to /auth/callback
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'; // Default redirect to home/dashboard

  if (code) {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Define functions for cookie operations
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            // The response object is needed to set the cookie
            const response = NextResponse.redirect(`${origin}${next}`);
            response.cookies.set({
              name,
              value,
              ...options,
            });
            // Note: This direct setting in GET is illustrative;
            // typically, you'd return the response from exchangeCodeForSession
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            const response = NextResponse.redirect(`${origin}${next}`);
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
            // Note: Similar to set, response handling is key
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful exchange, redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to an error page or home
  console.error('Auth callback error or no code provided');
  // Redirect to an error page or back to the origin
  return NextResponse.redirect(`${origin}/auth/auth-code-error`); // Consider creating this page
} 