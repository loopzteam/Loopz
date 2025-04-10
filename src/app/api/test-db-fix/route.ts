import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only - safe access to env vars including service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with SERVICE ROLE permissions
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Test user ID
const TEST_USER_ID = '7de1278b-fe2a-42a1-b1da-13be5c457dd7';

export async function GET() {
  const results: string[] = [];
  
  try {
    results.push('🔍 Starting database tests with SERVICE ROLE permissions...');
    
    // Test database schemas and records
    const dbStatus = await checkDatabaseSchema();
    results.push(...dbStatus);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema verified', 
      results 
    });
  } catch (error: any) {
    results.push(`❌ Error: ${error.message || String(error)}`);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error),
      results
    }, { status: 500 });
  }
}

/**
 * Check database schema and verify test records exist
 */
async function checkDatabaseSchema(): Promise<string[]> {
  const results: string[] = [];
  
  // Check loops table
  const { data: loops, error: loopsError } = await supabase
    .from('loops')
    .select('*')
    .limit(5);
    
  if (loopsError) {
    results.push(`❌ Error accessing loops table: ${loopsError.message}`);
    throw loopsError;
  }
  
  if (loops && loops.length > 0) {
    const columns = Object.keys(loops[0]);
    results.push(`✅ Loops table structure: ${columns.join(', ')}`);
    results.push(`📊 Found ${loops.length} existing loops`);
  } else {
    results.push('ℹ️ Loops table exists but is empty');
  }
  
  // Check tasks table
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(5);
    
  if (tasksError) {
    results.push(`❌ Error accessing tasks table: ${tasksError.message}`);
    throw tasksError;
  }
  
  if (tasks && tasks.length > 0) {
    const columns = Object.keys(tasks[0]);
    results.push(`✅ Tasks table structure: ${columns.join(', ')}`);
    results.push(`📊 Found ${tasks.length} existing tasks`);
  } else {
    results.push('ℹ️ Tasks table exists but is empty');
  }
  
  // Check messages table
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(5);
    
  if (messagesError) {
    results.push(`❌ Error accessing messages table: ${messagesError.message}`);
    throw messagesError;
  }
  
  if (messages && messages.length > 0) {
    const columns = Object.keys(messages[0]);
    results.push(`✅ Messages table structure: ${columns.join(', ')}`);
    results.push(`📊 Found ${messages.length} existing messages`);
  } else {
    results.push('ℹ️ Messages table exists but is empty');
  }
  
  return results;
} 