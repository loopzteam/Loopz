'use server'; // Mark this module as containing Server Actions

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function signOutAction() {
  const cookieStore = cookies();
  
  // Create Supabase client - configure with cookie handlers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) { console.error('(Ignorable) SA Error setting cookie:', error); }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) { console.error('(Ignorable) SA Error removing cookie:', error); }
        },
      },
    }
  );
  
  // Sign out from Supabase - this SHOULD use the remove handler above
  console.log('Server Action: Calling supabase.auth.signOut()...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error during supabase.auth.signOut:', error);
  }
  
  // Extract project ref from URL for thorough cookie cleaning
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? null;
  
  // Define standard options for cookie removal (MaxAge=0)
  const cookieOptions = { path: '/', maxAge: 0, secure: true, httpOnly: true, sameSite: 'lax' as const }; 
  // Ensure httpOnly and secure are set for server-side removal

  console.log('Server Action: Explicitly removing ALL known auth cookies...');
  try {
      // Clear common default/fallback names
      cookieStore.set('sb-access-token', '', cookieOptions);
      cookieStore.set('sb-refresh-token', '', cookieOptions);

      // Clear the project-specific cookie if ref exists
      if (projectRef) {
          cookieStore.set(`sb-${projectRef}-auth-token`, '', cookieOptions);
          // Also clear potential PKCE cookie
          cookieStore.set(`sb-${projectRef}-auth-token-code-verifier`, '', cookieOptions);
      }

      // Clear any potentially customized cookie name
      const customCookieName = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME;
      if (customCookieName) {
          cookieStore.set(customCookieName, '', cookieOptions);
      }
      console.log('Server Action: Explicit cookie removal calls completed.');
  } catch(e) {
      // Catch errors specifically during explicit removal
      console.error("Error during explicit cookie removal:", e);
  }

  console.log('Server Action: Sign out flow completed, attempting redirect to /auth');
  
  // Force redirect with cache busting query parameter
  return redirect('/auth?t=' + Date.now());
} 