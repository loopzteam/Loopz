import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

/**
 * Creates a Supabase client for use in **Client Components**.
 *
 * Important: This client is meant for browser-side operations and relies on
 * public environment variables (`NEXT_PUBLIC_`).
 * It automatically handles session persistence and refreshing.
 *
 * @returns Initialized Supabase browser client.
 * @throws Error if required environment variables are missing.
 */
export function createBrowserClient() {
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

  // Initialize and return the browser client
  return _createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
