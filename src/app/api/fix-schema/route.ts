import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/database.types';

// Server-side only - safe access to env vars including service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with SERVICE ROLE permissions
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

export async function GET() {
  try {
    // Analyze current schema
    const schema = await analyzeSchema();
    
    // Generate migration plan
    const migrationPlan = generateMigrationPlan(schema);
    
    return NextResponse.json({ 
      success: true, 
      schema,
      migrationPlan,
      message: 'Use POST to execute migrations'
    });
  } catch (error: any) {
    console.error('Schema analysis error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error)
    }, { status: 500 });
  }
}

/**
 * Execute migrations to fix schema issues
 */
export async function POST() {
  try {
    // Analyze current schema
    const schema = await analyzeSchema();
    
    // Generate migration plan
    const migrationPlan = generateMigrationPlan(schema);
    
    // Execute migrations
    const results = await executeMigrations(migrationPlan.migrations);
    
    // Re-analyze schema after migrations
    const updatedSchema = await analyzeSchema();
    
    return NextResponse.json({ 
      success: true,
      migrationPlan,
      results,
      beforeSchema: schema,
      afterSchema: updatedSchema
    });
  } catch (error: any) {
    console.error('Migration execution error:', error);
    
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
      // Get table info using PostgreSQL's information_schema
      const { data: columns, error: columnsError } = await supabase.rpc('table_columns', { table_name: table });
      
      if (columnsError) {
        // If RPC fails, try direct query to information_schema
        const { data: infoColumns, error: infoError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', table)
          .eq('table_schema', 'public');
        
        if (infoError) {
          schema[table] = { error: infoError.message };
          continue;
        }
        
        schema[table] = {
          exists: true,
          columns: infoColumns || [],
          columnNames: infoColumns ? infoColumns.map(col => col.column_name) : []
        };
      } else {
        schema[table] = {
          exists: true,
          columns: columns || [],
          columnNames: columns ? columns.map((col: any) => col.column_name) : []
        };
      }
      
      // Get a sample record
      const { data: sample } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      schema[table].sample = sample && sample.length > 0 ? sample[0] : null;
      
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
 * Execute migrations on the database using SQL directly
 */
async function executeMigrations(migrations: any[]) {
  const results: any[] = [];
  
  for (const migration of migrations) {
    try {
      let sql = '';
      let result;
      
      switch (migration.action) {
        case 'create_table':
          // SQL for creating a table
          sql = generateCreateTableSQL(migration.table, migration.columns);
          break;
          
        case 'add_column':
          // SQL for adding a column
          sql = generateAddColumnSQL(migration.table, migration.column);
          break;
          
        case 'rename_column':
          // SQL for renaming a column
          sql = `ALTER TABLE "${migration.table}" RENAME COLUMN "${migration.oldName}" TO "${migration.newName}";`;
          break;
      }
      
      // Execute the SQL
      if (sql) {
        const { data, error } = await supabase.rpc('run_sql', { query: sql });
        
        results.push({
          migration,
          sql,
          success: !error,
          data,
          error: error ? error.message : null
        });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(`Migration failed for ${migration.action} on ${migration.table}:`, error);
      
      results.push({
        migration,
        success: false,
        error: error.message || String(error)
      });
    }
  }
  
  return results;
}

/**
 * Generate SQL for adding a column
 */
function generateAddColumnSQL(table: string, column: string): string {
  let dataType = 'text';
  
  // Determine appropriate data type based on column name
  if (column.endsWith('_id')) dataType = 'uuid';
  if (column === 'created_at' || column === 'updated_at') dataType = 'timestamptz';
  if (column.startsWith('is_')) dataType = 'boolean';
  if (column === 'position') dataType = 'integer';
  
  // Set appropriate default value
  let defaultValue = '';
  if (dataType === 'boolean') defaultValue = 'DEFAULT false';
  if (column === 'created_at') defaultValue = 'DEFAULT now()';
  
  return `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${dataType} ${defaultValue};`;
}

/**
 * Generate SQL for creating a table
 */
function generateCreateTableSQL(table: string, columns: string[]): string {
  const columnDefs = columns.map(column => {
    let dataType = 'text';
    
    // Determine appropriate data type based on column name
    if (column === 'id') return `"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4()`;
    if (column.endsWith('_id')) dataType = 'uuid REFERENCES loops(id)';
    if (column === 'created_at') return `"created_at" timestamptz NOT NULL DEFAULT now()`;
    if (column === 'updated_at') return `"updated_at" timestamptz`;
    if (column.startsWith('is_')) dataType = 'boolean NOT NULL DEFAULT false';
    if (column === 'position') dataType = 'integer DEFAULT 0';
    
    return `"${column}" ${dataType}`;
  });
  
  return `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    CREATE TABLE IF NOT EXISTS "${table}" (
      ${columnDefs.join(',\n      ')}
    );
    
    ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "${table}_policy"
      ON "${table}"
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  `;
} 