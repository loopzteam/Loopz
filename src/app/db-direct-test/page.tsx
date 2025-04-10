'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Direct database test that completely bypasses any middleware
export default function DirectDatabaseTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  const getDirectClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    log(`Creating direct client with URL: ${supabaseUrl}`);
    log(`Key available: ${!!supabaseKey}`);
    
    return createBrowserClient(supabaseUrl, supabaseKey);
  };

  const checkDatabaseSchema = async (client: SupabaseClient) => {
    log('Checking database schema...');
    
    try {
      // Check loops table
      const { data: loops, error: loopsError } = await client
        .from('loops')
        .select('*')
        .limit(1);
        
      if (loopsError) {
        log(`❌ Error accessing loops table: ${loopsError.message}`);
        return false;
      }
      
      if (loops && loops.length > 0) {
        const columns = Object.keys(loops[0]);
        log(`✅ Found loops table with columns: ${columns.join(', ')}`);
      } else {
        log('ℹ️ Loops table exists but is empty');
      }
      
      // Check tasks table
      const { data: tasks, error: tasksError } = await client
        .from('tasks')
        .select('*')
        .limit(1);
        
      if (tasksError) {
        log(`❌ Error accessing tasks table: ${tasksError.message}`);
      } else {
        log('✅ Tasks table accessible');
      }
      
      // Check messages table (might be chat_messages)
      const { data: messages, error: messagesError } = await client
        .from('chat_messages')
        .select('*')
        .limit(1);
        
      if (messagesError) {
        log(`❌ Error accessing chat_messages table: ${messagesError.message}`);
        
        // Try alternative name
        const { error: altError } = await client
          .from('messages')
          .select('*')
          .limit(1);
          
        if (altError) {
          log(`❌ Error accessing messages table: ${altError.message}`);
        } else {
          log('✅ Messages table accessible (named "messages")');
        }
      } else {
        log('✅ Chat_messages table accessible');
      }
      
      return true;
    } catch (error) {
      log(`❌ Schema check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  const handleRunTest = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      log('🔍 Starting direct database test...');
      
      const client = getDirectClient();
      const schemaOk = await checkDatabaseSchema(client);
      
      if (!schemaOk) {
        log('❌ Schema check failed, cannot continue with tests');
        return;
      }
      
      log('✅ Direct database test completed');
    } catch (error) {
      log(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Direct Database Test</h1>
      <p className="mb-4">This test directly accesses the database, bypassing middleware and authentication systems.</p>
      
      <button
        onClick={handleRunTest}
        disabled={isRunning}
        className={`px-4 py-2 rounded text-white font-medium ${
          isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isRunning ? 'Running Test...' : 'Run Direct Database Test'}
      </button>
      
      {logs.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Logs</h2>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 