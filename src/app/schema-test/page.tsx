'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SchemaTestPage() {
  const [schema, setSchema] = useState<any>(null);
  const [migrationPlan, setMigrationPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('schema');

  const fetchSchema = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/schema-check');
      const data = await response.json();
      
      setSchema(data.schema || {});
      setMigrationPlan(data.migrationPlan || null);
      
      if (!data.success) {
        setError(data.error || 'Failed to fetch schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const runMigrations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-schema', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSchema(data.afterSchema || {});
        setMigrationPlan(data.migrationPlan || null);
        setTestResults([
          ...testResults,
          { type: 'success', message: 'Schema migration completed successfully' }
        ]);
      } else {
        setError(data.error || 'Migration failed');
        setTestResults([
          ...testResults,
          { type: 'error', message: `Migration failed: ${data.error}` }
        ]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setTestResults([
        ...testResults,
        { type: 'error', message: `Migration error: ${errorMsg}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const runCrudTests = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults([]);
    
    try {
      // Create a direct Supabase client for testing
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      setTestResults([
        { type: 'info', message: 'Starting CRUD tests...' }
      ]);
      
      // 1. Test authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: 'Authentication check passed' }
      ]);
      
      const userId = authData.session?.user?.id;
      
      if (!userId) {
        setTestResults(prev => [
          ...prev,
          { type: 'warning', message: 'No authenticated user. Some tests may fail due to RLS policies.' }
        ]);
      } else {
        setTestResults(prev => [
          ...prev,
          { type: 'info', message: `Authenticated as user: ${userId}` }
        ]);
      }
      
      // 2. Test Loop CRUD
      setTestResults(prev => [
        ...prev,
        { type: 'info', message: 'Testing Loop operations...' }
      ]);
      
      // Create
      const { data: loop, error: createError } = await supabase
        .from('loops')
        .insert({
          user_id: userId || '00000000-0000-0000-0000-000000000000',
          title: 'Test Loop',
          summary: 'Created from schema test'
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Loop creation error: ${createError.message}`);
      }
      
      const loopId = loop.id;
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: `Loop created with ID: ${loopId}` }
      ]);
      
      // Read
      const { data: readLoop, error: readError } = await supabase
        .from('loops')
        .select()
        .eq('id', loopId)
        .single();
      
      if (readError) {
        throw new Error(`Loop read error: ${readError.message}`);
      }
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: 'Loop read successful' }
      ]);
      
      // Update
      const { data: updatedLoop, error: updateError } = await supabase
        .from('loops')
        .update({ title: 'Updated Test Loop' })
        .eq('id', loopId)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Loop update error: ${updateError.message}`);
      }
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: 'Loop update successful' }
      ]);
      
      // 3. Test Task CRUD
      setTestResults(prev => [
        ...prev,
        { type: 'info', message: 'Testing Task operations...' }
      ]);
      
      // Create Task
      const newTask = {
        loop_id: loopId,
        parent_id: null,
        title: 'Test task',
        is_completed: false,
        is_expanded: true,
        position: 1
      };
      
      const { data: task, error: taskCreateError } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();
      
      if (taskCreateError) {
        throw new Error(`Task creation error: ${taskCreateError.message}`);
      }
      
      const taskId = task.id;
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: `Task created with ID: ${taskId}` }
      ]);
      
      // 4. Test Message CRUD
      setTestResults(prev => [
        ...prev,
        { type: 'info', message: 'Testing Message operations...' }
      ]);
      
      // Create Message
      const { data: message, error: messageCreateError } = await supabase
        .from('messages')
        .insert({
          loop_id: loopId,
          role: 'user',
          content: 'Test message'
        })
        .select()
        .single();
      
      if (messageCreateError) {
        throw new Error(`Message creation error: ${messageCreateError.message}`);
      }
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: 'Message created successfully' }
      ]);
      
      // 5. Clean up test data
      setTestResults(prev => [
        ...prev,
        { type: 'info', message: 'Cleaning up test data...' }
      ]);
      
      // Delete task
      const { error: taskDeleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (taskDeleteError) {
        throw new Error(`Task deletion error: ${taskDeleteError.message}`);
      }
      
      // Delete loop (should cascade delete messages)
      const { error: loopDeleteError } = await supabase
        .from('loops')
        .delete()
        .eq('id', loopId);
      
      if (loopDeleteError) {
        throw new Error(`Loop deletion error: ${loopDeleteError.message}`);
      }
      
      setTestResults(prev => [
        ...prev,
        { type: 'success', message: 'Test data cleanup successful' },
        { type: 'success', message: 'All CRUD tests passed!' }
      ]);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setTestResults(prev => [
        ...prev,
        { type: 'error', message: errorMsg }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch schema on initial load
  useEffect(() => {
    fetchSchema();
  }, []);
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Schema Test & Migration</h1>
      
      <div className="mb-8 space-x-2">
        <button
          onClick={fetchSchema}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Refresh Schema
        </button>
        
        <button
          onClick={runMigrations}
          disabled={isLoading || !migrationPlan || migrationPlan.migrations?.length === 0}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
        >
          Run Migrations {migrationPlan?.migrations?.length > 0 && `(${migrationPlan.migrations.length})`}
        </button>
        
        <button
          onClick={runCrudTests}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Run CRUD Tests
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {error}
        </div>
      )}
      
      <div className="mb-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'schema' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('schema')}
        >
          Schema
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'migrations' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('migrations')}
        >
          Migrations
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'tests' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          Test Results
        </button>
      </div>
      
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <span className="text-lg">Loading...</span>
        </div>
      ) : (
        <>
          {activeTab === 'schema' && schema && (
            <div className="mt-6 space-y-6">
              {Object.entries(schema).map(([tableName, tableInfo]: [string, any]) => (
                <div key={tableName} className="border rounded">
                  <div className="bg-gray-100 p-4 font-medium border-b">
                    Table: {tableName}
                    {tableInfo.error && <span className="text-red-500 ml-2">Error: {tableInfo.error}</span>}
                    {!tableInfo.error && !tableInfo.exists && <span className="text-yellow-500 ml-2">Table doesn't exist</span>}
                  </div>
                  
                  {tableInfo.exists && (
                    <div className="p-4">
                      <h3 className="font-medium mb-2">Columns:</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableInfo.columns?.map((col: any, i: number) => (
                              <tr key={i}>
                                <td className="px-6 py-4 whitespace-nowrap">{col.column_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{col.data_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{col.is_nullable}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {tableInfo.sample && (
                        <>
                          <h3 className="font-medium mt-4 mb-2">Sample Record:</h3>
                          <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
                            {JSON.stringify(tableInfo.sample, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'migrations' && migrationPlan && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Migration Plan</h2>
              
              {migrationPlan.migrations?.length === 0 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  No migrations needed! Schema is up to date.
                </div>
              ) : (
                <div className="space-y-4">
                  {migrationPlan.migrations?.map((migration: any, i: number) => (
                    <div key={i} className="p-4 border rounded">
                      <div className="font-medium">
                        {migration.action === 'create_table' && `Create table ${migration.table}`}
                        {migration.action === 'add_column' && `Add column ${migration.column} to ${migration.table}`}
                        {migration.action === 'rename_column' && `Rename column ${migration.oldName} to ${migration.newName} in ${migration.table}`}
                      </div>
                      
                      {migration.action === 'create_table' && (
                        <div className="mt-2 text-sm text-gray-700">
                          Columns: {migration.columns.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {migrationPlan.warnings?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Warnings:</h3>
                  <ul className="list-disc list-inside text-yellow-700">
                    {migrationPlan.warnings.map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'tests' && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Test Results</h2>
              
              {testResults.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                  No tests have been run yet. Click "Run CRUD Tests" to begin.
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded ${
                        result.type === 'success' ? 'bg-green-50 border border-green-200' :
                        result.type === 'error' ? 'bg-red-50 border border-red-200' :
                        result.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <span
                        className={
                          result.type === 'success' ? 'text-green-700' :
                          result.type === 'error' ? 'text-red-700' :
                          result.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }
                      >
                        {result.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 