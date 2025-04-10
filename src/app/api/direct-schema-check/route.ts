import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only - safe access to env vars including service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with SERVICE ROLE permissions
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Simple API to directly check database schema using service role
 */
export async function GET() {
  try {
    const schema: Record<string, any> = {};
    const tables = ['loops', 'tasks', 'messages', 'user_profiles'];
    
    for (const table of tables) {
      try {
        // Get table columns
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          schema[table] = { error: error.message };
          continue;
        }
        
        const sample = data && data.length > 0 ? data[0] : null;
        const columns = sample ? Object.keys(sample).map(col => ({
          column_name: col,
          data_type: typeof sample[col]
        })) : [];
        
        schema[table] = {
          exists: true,
          sample,
          columns,
          columnNames: columns.map(col => col.column_name)
        };
      } catch (error: any) {
        schema[table] = { error: error.message };
      }
    }
    
    // Compare with ideal schema
    const idealSchema = {
      'loops': ['id', 'user_id', 'title', 'summary', 'sentiment_score', 'created_at', 'updated_at'],
      'tasks': ['id', 'loop_id', 'parent_id', 'title', 'is_completed', 'is_expanded', 'position', 'created_at', 'updated_at'],
      'messages': ['id', 'loop_id', 'task_id', 'role', 'content', 'created_at'],
      'user_profiles': ['id', 'display_name', 'avatar_url', 'preferences', 'created_at', 'updated_at']
    };
    
    const analysis: Record<string, any> = {};
    
    for (const [table, idealColumns] of Object.entries(idealSchema)) {
      const tableInfo = schema[table];
      if (!tableInfo || !tableInfo.exists) {
        analysis[table] = { error: 'Table does not exist' };
        continue;
      }
      
      const actualColumns = tableInfo.columnNames || [];
      const missingColumns = idealColumns.filter(col => !actualColumns.includes(col));
      const extraColumns = actualColumns.filter(col => !idealColumns.includes(col));
      
      // Check for column name mapping
      const mappings: Record<string, string> = {};
      
      if (table === 'tasks') {
        if (actualColumns.includes('is_complete') && !actualColumns.includes('is_completed')) {
          mappings['is_complete'] = 'is_completed';
        }
        
        if (actualColumns.includes('is_expand') && !actualColumns.includes('is_expanded')) {
          mappings['is_expand'] = 'is_expanded';
        }
      }
      
      analysis[table] = {
        missingColumns,
        extraColumns,
        mappings
      };
    }
    
    return NextResponse.json({
      success: true,
      schema,
      analysis
    });
  } catch (error: any) {
    console.error('Schema check error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 