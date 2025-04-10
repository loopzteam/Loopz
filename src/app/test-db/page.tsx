'use client';

import { useState } from 'react';

export default function DatabaseTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      console.log('Sending request to server-side API to run tests with service role key');
      
      const response = await fetch('/api/db-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error running tests');
      }
      
      setResults(data);
    } catch (error) {
      console.error('Test run failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
      setHasRun(true);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Operations Test</h1>
      
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Important</h2>
        <p className="text-yellow-700 mb-2">
          Before running tests, open the <code className="bg-yellow-100 px-1 rounded">src/lib/db-test.ts</code> file 
          and update the <code className="bg-yellow-100 px-1 rounded">TEST_USER_ID</code> constant with a valid
          user ID from your database.
        </p>
        <p className="text-yellow-700">
          These tests will create and then delete test data in your database.
        </p>
        <p className="text-yellow-700 mt-2">
          <strong>Note:</strong> Tests now run via a server-side API route that has access to the service role key.
        </p>
      </div>
      
      <button
        onClick={handleRunTests}
        disabled={isRunning}
        className={`px-4 py-2 rounded text-white font-medium ${
          isRunning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isRunning ? 'Running Tests...' : 'Run Database Tests'}
      </button>
      
      {isRunning && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
          <p className="text-blue-700">
            Tests are running. Check your browser console (F12) for detailed results.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded">
          <p className="text-red-700">
            Error: {error}
          </p>
        </div>
      )}
      
      {!isRunning && hasRun && !error && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded">
          <p className="text-green-700">
            Tests completed successfully! See the browser console (F12) for detailed results.
          </p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">What's being tested:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Database connection</li>
          <li>Loop CRUD operations (create, read, update, delete)</li>
          <li>Task management with parent-child relationships</li>
          <li>Message handling</li>
          <li>Error handling with DbError class</li>
        </ul>
      </div>
    </div>
  );
} 