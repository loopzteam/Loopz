/**
 * ACTIVE DATABASE TEST API ROUTE
 * 
 * This server-side API route executes database tests using the service role key.
 * Access this endpoint by calling POST /api/db-test.
 * 
 * SECURITY NOTE:
 * - This endpoint uses the service role key which has full database access
 * - Consider disabling or protecting this endpoint in production
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { runDatabaseTests } from '@/lib/db-test';
import { setTestClient } from '@/lib/db';

export async function POST() {
  // Server-side environment variables access will work here
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    return NextResponse.json(
      { success: false, error: "Missing Supabase URL" },
      { status: 500 }
    );
  }
  
  if (!serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: "Service role key not found in environment" },
      { status: 500 }
    );
  }

  console.log('API: Creating Supabase client with service role key');
  
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Set the test client globally
    setTestClient(supabase);
    
    // Create a wrapper to capture test results
    const results: any[] = [];
    const captureLog = (message: string) => {
      results.push({ message, timestamp: new Date().toISOString() });
      console.log(message);
    };
    
    // Run the tests with logging
    await runDatabaseTests(supabase);
    
    return NextResponse.json({ 
      success: true, 
      message: "Database tests completed",
      results
    });
  } catch (error) {
    console.error('API: Database test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 