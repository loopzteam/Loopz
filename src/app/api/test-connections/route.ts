import { NextResponse } from "next/server";
// import { createServerClient } from '@/lib/supabase/server'; // Use server client for API routes
import { createServerClient } from "../../../lib/supabase/server"; // Using relative path
import OpenAI from "openai";

// Define a more specific type for the status data
type StatusData = {
  message?: string;
  // Remove profile table check fields
  modelCount?: number;
};

// Route handler for GET requests to test connections
export async function GET() {
  let supabaseStatus: { connected: boolean; error?: string; data: StatusData } = {
    connected: false,
    data: {} // Initialize data here to avoid undefined issues
  };
  let openaiStatus: { connected: boolean; error?: string; data: StatusData } = {
    connected: false,
    data: {}
  };

  // --- Test Supabase Connection ---
  try {
    const supabase = createServerClient();
    const { data: _data, error } = await supabase.auth.getUser();

    if (error && error.message !== "Auth session missing!") {
      throw new Error(`Supabase auth error: ${error.message}`);
    }
    
    // Initialize supabaseStatus fully upon successful connection
    supabaseStatus = {
      connected: true,
      data: { // Ensure data is initialized here
        message: "Successfully connected and performed basic auth check.",
      },
    };

    // --- REMOVED Check for Profiles Table ---
    
  } catch (error: unknown) {
    console.error("Supabase connection test failed:", error);
    let errorMessage = "Unknown Supabase error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Ensure data is an empty object even on error
    supabaseStatus = { connected: false, error: errorMessage, data: {} };
  }
  
  // --- Test OpenAI Connection ---
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const models = await openai.models.list();
    openaiStatus = {
      connected: true,
      data: {
        modelCount: models.data.length,
        message: "Successfully connected and listed models.",
      },
    };
  } catch (error: unknown) {
    console.error("OpenAI connection test failed:", error);
    let errorMessage = "Unknown OpenAI error";
    if (error instanceof Error) {
      errorMessage = error.message;
      // @ts-expect-error - Accessing potentially non-standard property 'code'
      if ('code' in error && error.code === "invalid_api_key") {
        errorMessage = "Invalid OpenAI API Key.";
      } else if (error.message?.includes("OPENAI_API_KEY")) {
        errorMessage = error.message;
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    // Ensure data is an empty object even on error
    openaiStatus = { connected: false, error: errorMessage, data: {} };
  }
  
  // --- Return Combined Status ---
  const allConnected = supabaseStatus.connected && openaiStatus.connected;
  return NextResponse.json(
    {
      message: allConnected ? "All services connected successfully." : "One or more services failed to connect.",
      supabase: supabaseStatus,
      openai: openaiStatus,
    },
    { status: allConnected ? 200 : 500 }
  );
}
