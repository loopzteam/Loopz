'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import type { Loop } from '@/lib/types';

/**
 * LoopList component - displays all loops for the user
 */
export function LoopList() {
  const { loops, setLoops: _setLoops, setCurrentLoopId, isLoading } = useStore();
  const router = useRouter();
  
  useEffect(() => {
    // Fetch loops when component mounts
    // Implementation will go here
  }, []);
  
  const handleLoopClick = (loopId: string) => {
    setCurrentLoopId(loopId);
    router.push(`/loop/${loopId}`);
  };
  
  if (isLoading) {
    return <div>Loading loops...</div>;
  }
  
  if (loops.length === 0) {
    return <div>No loops yet. Start a conversation to create one!</div>;
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Your Loops</h2>
      <div className="space-y-3">
        {loops.map((loop: Loop) => (
          <div 
            key={loop.id} 
            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => handleLoopClick(loop.id)}
          >
            <h3 className="font-medium">{loop.title || 'Untitled Loop'}</h3>
            <p className="text-sm text-gray-500 truncate">{loop.content}</p>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{new Date(loop.created_at).toLocaleDateString()}</span>
              <span>{loop.is_completed ? 'Completed' : 'In Progress'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 