import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Loop, Task } from '@/lib/types';

// Server-side only - can safely access environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with SERVICE ROLE permissions
// This bypasses all RLS policies
const supabase = createClient(supabaseUrl, serviceRoleKey);

const TEST_USER_ID = '7de1278b-fe2a-42a1-b1da-13be5c457dd7'; 

export async function GET() {
  const results: any[] = [];
  let testLoopId: string | null = null;
  
  try {
    results.push('🔍 Starting database tests with SERVICE ROLE permissions');
    
    // Test database connection
    results.push('Testing database connection...');
    const { data: loops, error: connectionError } = await supabase
      .from('loops')
      .select('*')
      .limit(1);
      
    if (connectionError) throw connectionError;
    results.push('✅ Database connection successful');
    
    // Check loops table schema
    if (loops && loops.length > 0) {
      const columns = Object.keys(loops[0]);
      results.push(`✅ Loops table has columns: ${columns.join(', ')}`);
    } else {
      results.push('ℹ️ Loops table exists but is empty');
    }
    
    // Create a test loop
    results.push('Testing loop creation...');
    const { data: loop, error: createError } = await supabase
      .from('loops')
      .insert({
        user_id: TEST_USER_ID,
        title: 'API Test Loop'
      })
      .select('*')
      .single();
      
    if (createError) throw createError;
    if (!loop) throw new Error('Loop creation returned no data');
    
    testLoopId = loop.id;
    results.push(`✅ Loop created with ID: ${loop.id}`);
    
    // Test getting the loop
    const { data: fetchedLoop, error: fetchError } = await supabase
      .from('loops')
      .select('*')
      .eq('id', loop.id)
      .single();
      
    if (fetchError) throw fetchError;
    if (!fetchedLoop) throw new Error(`Could not fetch loop with ID ${loop.id}`);
    results.push('✅ Loop retrieved successfully');
    
    // Test updating the loop
    const { data: updatedLoop, error: updateError } = await supabase
      .from('loops')
      .update({ title: 'Updated API Test Loop' })
      .eq('id', loop.id)
      .select('*')
      .single();
      
    if (updateError) throw updateError;
    if (!updatedLoop) throw new Error(`Could not update loop with ID ${loop.id}`);
    results.push('✅ Loop updated successfully');
    
    // Test creating a task
    const newTask = {
      loop_id: loop.id,
      parent_id: null,
      title: 'Test task for API',
      is_completed: false,
      is_expanded: true,
      position: 1
    };
    
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(newTask)
      .select('*')
      .single();
      
    if (taskError) throw taskError;
    if (!task) throw new Error('Task creation returned no data');
    results.push(`✅ Task created with ID: ${task.id}`);
    
    // Cleanup - delete the test data
    if (testLoopId) {
      // Delete the loop (this should cascade delete tasks)
      const { error: deleteError } = await supabase
        .from('loops')
        .delete()
        .eq('id', testLoopId);
        
      if (deleteError) throw deleteError;
      results.push('✅ Test data cleaned up successfully');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All tests passed!', 
      results 
    });
  } catch (error: any) {
    // Try to clean up test data even if tests fail
    if (testLoopId) {
      try {
        await supabase.from('loops').delete().eq('id', testLoopId);
      } catch (cleanupError) {
        results.push(`❌ Cleanup error: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
      }
    }
    
    results.push(`❌ Test failed: ${error.message || String(error)}`);
    
    if (error.code) {
      results.push(`Error code: ${error.code}`);
    }
    
    if (error.details) {
      results.push(`Error details: ${error.details}`);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error),
      results
    }, { status: 500 });
  }
} 