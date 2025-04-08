import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Database } from "./database.types";

/**
 * Creates a Supabase client specifically for use in **Next.js Middleware**.
 *
 * This client requires the `NextRequest` and `NextResponse` objects to manage cookies
 * effectively during server-side request processing.
 * It reads public environment variables (`NEXT_PUBLIC_`).
 *
 * @param req The incoming NextRequest object.
 * @param res The outgoing NextResponse object (can be modified by the client).
 * @returns Initialized Supabase server client configured for middleware.
 * @throws Error if required environment variables are missing.
 */
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    // Log prominently in middleware context as it can be harder to debug
    console.error(
      "FATAL ERROR: Missing environment variable: NEXT_PUBLIC_SUPABASE_URL in middleware",
    );
    throw new Error(
      "Supabase URL is not configured. Middleware cannot function.",
    );
  }

  if (!supabaseAnonKey) {
    console.error(
      "FATAL ERROR: Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY in middleware",
    );
    throw new Error(
      "Supabase Anon Key is not configured. Middleware cannot function.",
    );
  }

  // Initialize and return the middleware-specific client
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Read cookie from the incoming request
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      // Set cookie on both the request (for immediate use) and response (for browser)
      set(name: string, value: string, options: CookieOptions) {
        try {
          req.cookies.set({ name, value, ...options });
          // The response object is essential in middleware to actually send the updated cookie back to the browser.
          res.cookies.set({ name, value, ...options });
        } catch (error) {
          // Handle potential errors during cookie setting (though less common in middleware)
          console.error("Error setting Supabase cookie in middleware:", error);
        }
      },
      // Remove cookie on both request and response
      remove(name: string, options: CookieOptions) {
        try {
          req.cookies.set({ name, value: "", ...options });
          // Ensure the cookie removal instruction is sent back to the browser via the response.
          res.cookies.set({ name, value: "", ...options });
        } catch (error) {
          // Handle potential errors during cookie removal
          console.error("Error removing Supabase cookie in middleware:", error);
        }
      },
    },
  });
}
