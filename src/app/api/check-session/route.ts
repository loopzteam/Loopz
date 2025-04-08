import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET handler for checking session status
 * @param _request - The incoming request (unused)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  // Get cookie store instance
  const cookieStore = await cookies();

  // Create Supabase client with read-only cookie access for checking
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Get a cookie by name
         * @param _name - The name of the cookie to get
         */
        get(_name: string) {
          return cookieStore.get(_name)?.value;
        },
        /**
         * Set a cookie (no-op for read-only check)
         * @param _name - The name of the cookie
         * @param _value - The value to set
         * @param _options - Cookie options
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_name: string, _value: string, _options: CookieOptions) {
          // No-op for read-only check
        },
        /**
         * Remove a cookie (no-op for read-only check)
         * @param _name - The name of the cookie to remove
         * @param _options - Cookie options
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(_name: string, _options: CookieOptions) {
          // No-op for read-only check
        },
      },
    },
  );

  // Try to get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get all cookies currently readable by the server
  const allCookies = await cookieStore.getAll();

  // Return JSON response
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hasSession: !!session, // True if session object exists, false otherwise
    sessionExpiresAt: session?.expires_at,
    // Log names and truncated values for safety
    readableCookies: allCookies.map((c: { name: string; value: string }) => ({
      name: c.name,
      value: c.value.substring(0, 10) + "...",
    })),
  });
}
