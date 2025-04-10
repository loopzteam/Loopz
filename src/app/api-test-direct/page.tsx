'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  const runApiTest = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/test-db-fix');
      const data = await response.json();
      
      setResults(data.results || []);
      setSuccess(data.success);
      
      if (!data.success) {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Server-Side Database Test</h1>
      <p className="mb-4 text-gray-700">
        This test directly accesses the database using the SERVICE ROLE API key on the server side, 
        bypassing all RLS policies and authentication barriers.
      </p>
      
      <button
        onClick={runApiTest}
        disabled={isLoading}
        className={`px-4 py-2 rounded text-white font-medium ${
          isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isLoading ? 'Running Test...' : 'Run Server-Side Database Test'}
      </button>
      
      {results.length > 0 && (
        <div className={`mt-6 p-4 border rounded ${
          success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h2 className={`text-lg font-semibold mb-2 ${
            success ? 'text-green-700' : 'text-red-700'
          }`}>
            {success ? 'Tests Completed Successfully!' : 'Tests Failed'}
          </h2>
          
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`${result.includes('❌') ? 'text-red-400' : ''}`}>
                {result}
              </div>
            ))}
            
            {error && (
              <div className="text-red-400 mt-2">Error: {error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 