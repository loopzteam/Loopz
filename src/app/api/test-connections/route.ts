import { NextResponse } from "next/server";
// import { createServerClient } from '@/lib/supabase/server'; // Use server client for API routes
import { createServerClient } from "../../../lib/supabase/server"; // Using relative path
import OpenAI from "openai";

// Route handler for GET requests to test connections
export async function GET() {
  let supabaseStatus: { connected: boolean; error?: string; data?: unknown } = {
    connected: false,
  };
  let openaiStatus: { connected: boolean; error?: string; data?: unknown } = {
    connected: false,
  };

  // --- Test Supabase Connection ---
  try {
    // Initialize Supabase client
    // Note: In Route Handlers, cookies() are not directly available.
    // The createServerClient here will use env vars but won't have cookie context
    // unless passed explicitly, which isn't needed for just testing basic connection/auth read.
    // For a real authenticated call, you'd need header/cookie handling.
    const supabase = createServerClient();

    // Attempt a simple read operation (e.g., get user, which requires anon key access)
    // If this doesn't throw, the URL and anon key are likely correct.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _data, error } = await supabase.auth.getUser(); // Prefix data with underscore

    if (error && error.message !== "Auth session missing!") {
      // Ignore "missing session" as we are unauthenticated
      throw new Error(`Supabase auth error: ${error.message}`);
    }
    supabaseStatus = {
      connected: true,
      data: {
        message: "Successfully connected and performed basic auth check.",
      },
    };
  } catch (error: unknown) {
    // Change type to unknown
    console.error("Supabase connection test failed:", error);
    let errorMessage = "Unknown Supabase error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    supabaseStatus = { connected: false, error: errorMessage };
  }

  // --- Test OpenAI Connection ---
  try {
    // Check if the API key is provided
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Attempt a simple API call (e.g., list models)
    // If this doesn't throw, the API key is likely valid and connection works.
    const models = await openai.models.list();

    openaiStatus = {
      connected: true,
      data: {
        modelCount: models.data.length,
        message: "Successfully connected and listed models.",
      },
    };
  } catch (error: unknown) {
    // Change type to unknown
    console.error("OpenAI connection test failed:", error);
    // Provide more specific feedback for common errors
    let errorMessage = "Unknown OpenAI error";
    // Need to check error type before accessing properties like .code or .message
    if (error instanceof Error) {
      // Standard Error properties
      errorMessage = error.message;
      // Check for OpenAI specific error structure (example, might vary)
      // @ts-expect-error - Accessing potentially non-standard property 'code'
      if (error.code === "invalid_api_key") {
        errorMessage = "Invalid OpenAI API Key.";
      } else if (error.message?.includes("OPENAI_API_KEY")) {
        errorMessage = error.message; // Keep specific message about missing key
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    openaiStatus = { connected: false, error: errorMessage };
  }

  // --- Return Combined Status ---
  const allConnected = supabaseStatus.connected && openaiStatus.connected;

  return NextResponse.json(
    {
      message: allConnected
        ? "All services connected successfully."
        : "One or more services failed to connect.",
      supabase: supabaseStatus,
      openai: openaiStatus,
    },
    { status: allConnected ? 200 : 500 }, // Return 200 if all OK, 500 otherwise
  );
}
