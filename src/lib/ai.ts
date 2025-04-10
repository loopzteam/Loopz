import OpenAI from 'openai';
import type { ChatMessage, HeadCoachResponse, AssistantCoachResponse } from './types';

// Initialize OpenAI client
const _openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------------------------------
// Prompt Templates
// --------------------------------

const PROMPTS = {
  head: {
    base: `You are the Loopz Head Coach, a thoughtful, empathetic guide helping users untangle complex thoughts. 
Your responses should be warm, concise, and focused on understanding the user's core challenge.
Avoid asking generic questions. Focus on understanding their specific situation.`,
    
    tasks: `You are the Loopz Head Coach, a thoughtful, empathetic guide helping users untangle complex thoughts.
Based on the conversation so far, provide:
1. A brief empathetic reflection (2-3 sentences) acknowledging their situation
2. A list of 3-5 actionable steps that would help them address their core challenge
   - Each step should be clear, concrete, and achievable
   - Focus on immediate actions they can take`,
  },
  
  assistant: {
    base: `You are the Loopz Assistant Coach, helping users complete tasks within their larger goals.
Your responses should be practical, encouraging, and focused on helping them accomplish their current task.`,
    
    breakdown: `You are the Loopz Assistant Coach, helping users complete tasks within their larger goals.
Break down the following task into 3-5 smaller substeps:
"{task}"
Make each substep concrete, specific, and actionable.`,
  },
  
  compression: `You are a summarization expert. Based on the conversation history below, create a concise summary 
that captures the essential context and insights. Focus on the core challenge, emotional state, 
and key details that would be important for continuing this conversation.
Keep your summary under a paragraph (3-5 sentences).`
};

// --------------------------------
// Coach Response Functions
// --------------------------------

export type CoachRole = 'head' | 'assistant';
export type ResponsePurpose = 'conversation' | 'tasks' | 'breakdown';

/**
 * Generate a response from the Head Coach
 */
export async function generateHeadCoachResponse(
  messages: ChatMessage[], 
  purpose: 'conversation' | 'tasks' = 'conversation'
): Promise<HeadCoachResponse> {
  const _systemPrompt = purpose === 'conversation' 
    ? PROMPTS.head.base 
    : PROMPTS.head.tasks;
  
  // Implementation to call OpenAI goes here
  
  return {
    text: "I'll help you with that. Let me understand your situation better.",
    // Other fields would be populated based on OpenAI response
  };
}

/**
 * Generate a response from the Assistant Coach
 */
export async function generateAssistantCoachResponse(
  messages: ChatMessage[],
  purpose: 'conversation' | 'breakdown' = 'conversation',
  taskToBreakdown?: string
): Promise<AssistantCoachResponse> {
  const _systemPrompt = purpose === 'conversation'
    ? PROMPTS.assistant.base
    : PROMPTS.assistant.breakdown.replace('{task}', taskToBreakdown || '');
  
  // Implementation to call OpenAI goes here
  
  return {
    text: "Let's break that down into manageable steps.",
    // Other fields would be populated based on OpenAI response
  };
}

/**
 * Compress conversation history into a summary
 */
export async function compressConversation(
  _messages: ChatMessage[]
): Promise<string> {
  // Implementation to call OpenAI with PROMPTS.compression
  
  return "Summary of the conversation would go here.";
} 