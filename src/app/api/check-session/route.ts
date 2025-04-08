import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Get cookie store instance
  const cookieStore = cookies();

  // Create Supabase client with read-only cookie access for checking
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) { 
          // No-op for read-only check 
        },
        remove(name: string, options: CookieOptions) { 
          // No-op for read-only check
        },
      },
    }
  );

  // Try to get the session
  const { data: { session } } = await supabase.auth.getSession();

  // Get all cookies currently readable by the server
  const allCookies = cookieStore.getAll(); // This method *should* exist

  // Return JSON response
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hasSession: !!session, // True if session object exists, false otherwise
    sessionExpiresAt: session?.expires_at,
    // Log names and truncated values for safety
    readableCookies: allCookies.map((c: { name: string; value: string }) => ({ name: c.name, value: c.value.substring(0, 10) + '...' })), 
  });
} 