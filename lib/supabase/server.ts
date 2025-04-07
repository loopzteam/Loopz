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

  // Get the cookie store from next/headers
  const cookieStore = cookies();

  // Initialize and return the server client
  return _createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // The `get` method is used to read the session from cookies
      get(name: string) {
        // @ts-expect-error TSError: Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'.
        // This error seems related to Next.js 15/React 19 type inference for `cookies()`
        // in Server Component contexts. Supabase SSR relies on this pattern.
        // Suppressing the error for now as the functionality works during runtime.
        // TODO: Revisit this when library types are updated or issue is resolved.
        return cookieStore.get(name)?.value;
      },
      // NOTE: The @supabase/ssr package expects set and remove methods.
      // Although they are non-functional & cause warnings in pure Server Components,
      // they are REQUIRED by the library for Server Actions and Route Handlers where
      // cookies ARE mutable. Leaving them empty or console.warn would break those contexts.
      // Therefore, we keep the standard implementation using try/catch.
      set(
        name: string,
        value: string,
        options: import("@supabase/ssr").CookieOptions,
      ) {
        try {
          // @ts-expect-error // See explanation for get() - necessary for mutable contexts
          cookieStore.set({ name, value, ...options });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // Prefix error with underscore
          // In Server Components, set is not available. Supabase expects this method
          // to exist, but errors can be ignored if middleware handles session refresh.
          // console.warn('Supabase server client: Error setting cookie in read-only context', error);
        }
      },
      remove(name: string, options: import("@supabase/ssr").CookieOptions) {
        try {
          // @ts-expect-error // See explanation for get() - necessary for mutable contexts
          cookieStore.set({ name, value: "", ...options });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // Prefix error with underscore
          // In Server Components, remove (via set) is not available.
          // Errors can be ignored if middleware handles session refresh.
          // console.warn('Supabase server client: Error removing cookie in read-only context', error);
        }
      },
    },
  });
}
