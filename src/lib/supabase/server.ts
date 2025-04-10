import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./database.types";

/**
 * Creates a Supabase client for use in **Server Components, Server Actions,
 * and Route Handlers**.
 *
 * Important: This client relies on `next/headers.cookies()` for session management.
 * It reads public environment variables (`NEXT_PUBLIC_`).
 * Cookie `set` and `remove` operations within this client **will cause warnings**
 * if called directly from Server Components (as they are read-only), but are handled
 * correctly in Server Actions and Route Handlers, or via middleware refreshing.
 *
 * @returns Initialized Supabase server client.
 * @throws Error if required environment variables are missing.
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.warn("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
    throw new Error(
      "Supabase URL is not configured. Please check your environment variables.",
    );
  }

  if (!supabaseAnonKey) {
    console.warn("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error(
      "Supabase Anon Key is not configured. Please check your environment variables.",
    );
  }

  // Initialize and return the server client
  return _createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // The `get` method is used to read the session from cookies
      get(name: string) {
        try {
          // We need to access the cookies synchronously here.
          // Note that this will generate a warning, but the app will function correctly.
          // Next.js 15 recommends using cookies() with await, but the Supabase
          // client expects a synchronous API.
          const cookieStore = cookies();
          // @ts-ignore - Suppressing error as this works despite the warning
          return cookieStore.get(name)?.value;
        } catch (error) {
          console.error('Error reading cookie:', name, error);
          return undefined;
        }
      },
      // NOTE: The @supabase/ssr package expects set and remove methods.
      // Although they are non-functional & cause warnings in pure Server Components,
      // they are REQUIRED by the library for Server Actions and Route Handlers where
      // cookies ARE mutable.
      set(
        name: string,
        value: string,
        options: import("@supabase/ssr").CookieOptions,
      ) {
        try {
          const cookieStore = cookies();
          // @ts-ignore - Suppressing error as this works despite the warning
          cookieStore.set({ name, value, ...options });
        } catch (_error) {
          // In Server Components, set is not available. Supabase expects this method
          // to exist, but errors can be ignored if middleware handles session refresh.
        }
      },
      remove(name: string, options: import("@supabase/ssr").CookieOptions) {
        try {
          const cookieStore = cookies();
          // @ts-ignore - Suppressing error as this works despite the warning
          cookieStore.set({ name, value: "", ...options });
        } catch (_error) {
          // In Server Components, remove (via set) is not available.
          // Errors can be ignored if middleware handles session refresh.
        }
      },
    },
  });
}
