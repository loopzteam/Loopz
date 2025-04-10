import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only - safe access to env vars including service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with SERVICE ROLE permissions
const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function GET() {
  try {
    // Analyze database schema for all tables
    const schema = await analyzeSchema();
    
    return NextResponse.json({ 
      success: true, 
      schema
    });
  } catch (error: any) {
    console.error('Schema check error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error)
    }, { status: 500 });
  }
}

/**
 * Analyze the database schema for all tables
 */
async function analyzeSchema() {
  const tables = ['loops', 'tasks', 'messages', 'user_profiles'];
  const schema: Record<string, any> = {};
  
  for (const table of tables) {
    try {
      // Get table info using Postgres metadata query
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', table)
        .eq('table_schema', 'public');
      
      if (columnsError) {
        schema[table] = { error: columnsError.message };
        continue;
      }
      
      // Get a sample record from the table
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      schema[table] = {
        exists: true,
        columns: columns || [],
        columnNames: columns ? columns.map(col => col.column_name) : [],
        sample: sample && sample.length > 0 ? sample[0] : null,
        sampleError: sampleError ? sampleError.message : null
      };
      
    } catch (error: any) {
      schema[table] = { 
        exists: false,
        error: error.message || String(error)
      };
    }
  }
  
  return schema;
}

/**
 * Function to create the migration script for fixing schema issues
 */
export async function POST() {
  try {
    // Get current schema
    const schema = await analyzeSchema();
    
    // Generate migration plan
    const migrationPlan = generateMigrationPlan(schema);
    
    // If executing migrations directly:
    if (migrationPlan.migrations.length > 0) {
      await executeMigrations(migrationPlan.migrations);
    }
    
    return NextResponse.json({ 
      success: true, 
      currentSchema: schema,
      migrationPlan
    });
  } catch (error: any) {
    console.error('Error analyzing schema for migration:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error)
    }, { status: 500 });
  }
}

/**
 * Generate a migration plan based on schema differences
 */
function generateMigrationPlan(schema: Record<string, any>) {
  const idealSchema = {
    'loops': ['id', 'user_id', 'title', 'summary', 'sentiment_score', 'created_at', 'updated_at'],
    'tasks': ['id', 'loop_id', 'parent_id', 'title', 'is_completed', 'is_expanded', 'position', 'created_at', 'updated_at'],
    'messages': ['id', 'loop_id', 'task_id', 'role', 'content', 'created_at'],
    'user_profiles': ['id', 'display_name', 'avatar_url', 'preferences', 'created_at', 'updated_at']
  };
  
  const migrations: any[] = [];
  const warnings: string[] = [];
  
  // Compare current schema with ideal schema
  Object.entries(idealSchema).forEach(([table, idealColumns]) => {
    const currentTable = schema[table];
    
    // Table doesn't exist
    if (!currentTable || !currentTable.exists) {
      migrations.push({
        table,
        action: 'create_table',
        columns: idealColumns
      });
      return;
    }
    
    // Get current columns
    const currentColumns = currentTable.columnNames || [];
    
    // Find missing columns
    const missingColumns = idealColumns.filter(col => !currentColumns.includes(col));
    
    // Find columns with wrong names (like is_complete instead of is_completed)
    const wrongNamedColumns: Record<string, string> = {};
    
    if (table === 'tasks') {
      if (currentColumns.includes('is_complete') && !currentColumns.includes('is_completed')) {
        wrongNamedColumns['is_complete'] = 'is_completed';
      }
      
      if (currentColumns.includes('is_expand') && !currentColumns.includes('is_expanded')) {
        wrongNamedColumns['is_expand'] = 'is_expanded';
      }
    }
    
    // Add column migrations
    missingColumns.forEach(column => {
      migrations.push({
        table,
        action: 'add_column',
        column
      });
    });
    
    // Add rename column migrations
    Object.entries(wrongNamedColumns).forEach(([oldName, newName]) => {
      migrations.push({
        table,
        action: 'rename_column',
        oldName,
        newName
      });
    });
  });
  
  return {
    migrations,
    warnings
  };
}

/**
 * Execute migrations on the database
 */
async function executeMigrations(migrations: any[]) {
  for (const migration of migrations) {
    try {
      switch (migration.action) {
        case 'add_column':
          // Add column based on type
          let dataType = 'text';
          if (migration.column.includes('id')) dataType = 'uuid';
          if (migration.column.includes('created_at') || migration.column.includes('updated_at')) dataType = 'timestamptz';
          if (migration.column.includes('is_')) dataType = 'boolean';
          if (migration.column === 'position') dataType = 'integer';
          
          await supabase.rpc('add_column', {
            p_table: migration.table,
            p_column: migration.column,
            p_type: dataType
          });
          break;
          
        case 'rename_column':
          await supabase.rpc('rename_column', {
            p_table: migration.table,
            p_old_name: migration.oldName,
            p_new_name: migration.newName
          });
          break;
      }
    } catch (error) {
      console.error(`Migration failed for ${migration.action} on ${migration.table}:`, error);
      throw error;
    }
  }
} 