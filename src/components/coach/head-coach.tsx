'use client';

import { useState } from 'react';
import { useStore } from '@/store';

/**
 * Head Coach component - handles initial user conversation and loop creation
 */
export function HeadCoach() {
  const [input, setInput] = useState('');
  const [_messages, _setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, _setIsLoading] = useState(false);
  
  const handleSendMessage = async () => {
    // Implementation will go here
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Messages will be rendered here */}
      </div>
      
      <div className="border-t p-4 flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 px-4 py-2 border rounded-lg mr-2"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
} 