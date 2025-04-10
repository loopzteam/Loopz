/**
 * Core type definitions for Loopz
 * These types represent the core domain objects in the application
 */

// --------------------------------
// Entity Types
// --------------------------------

/**
 * User type - represents an authenticated user
 */
export interface User {
  id: string;                // UUID corresponding to auth.users.id
  email?: string;            // User email address
  created_at: string;        // ISO date string of creation time
  updated_at?: string;       // ISO date string of last update
}

/**
 * User Profile type - extends User with profile information
 */
export interface UserProfile {
  id: string;                // UUID primary key
  display_name?: string;     // Optional display name
  avatar_url?: string;       // Optional avatar URL
  preferences?: any;         // User preferences (JSON)
  created_at: string;        // ISO date string of creation time
  updated_at?: string;       // ISO date string of last update
}

/**
 * Loop type - represents a journal entry or coaching session
 * Matches actual database schema in Supabase
 */
export interface Loop {
  id: string;                // UUID primary key
  user_id: string;           // Foreign key to User.id
  title?: string;            // Optional title
  summary?: string;          // Optional AI-generated summary
  sentiment_score?: number;  // Optional sentiment analysis score (-1 to 1)
  created_at: string;        // ISO date string of creation time
  updated_at?: string;       // ISO date string of last update
}

/**
 * Task type - represents an action item generated from a loop
 * Matches actual database schema in Supabase
 */
export interface Task {
  id: string;                // UUID primary key
  loop_id: string;           // Foreign key to Loop.id
  parent_id: string | null;  // ID of parent task for nested tasks (null for top-level)
  title: string;             // Task title
  is_completed: boolean;     // Whether the task is completed
  is_expanded: boolean;      // UI state for expanding/collapsing subtasks
  position: number;          // Position for ordering tasks
  created_at: string;        // ISO date string of creation time
  updated_at?: string;       // ISO date string of last update
}

/**
 * Chat Message type - represents a message in a coaching conversation
 * Table name is 'messages' in Supabase
 */
export interface ChatMessage {
  id: string;                // UUID primary key
  loop_id: string;           // Foreign key to Loop.id
  task_id?: string;          // Optional foreign key to Task.id
  role: 'user' | 'assistant' | 'system' | 'head_coach'; // Message sender role
  content: string;           // Message content
  created_at: string;        // ISO date string of creation time 
}

// --------------------------------
// Action Types
// --------------------------------

/**
 * Action types for creating new entities without IDs
 */
export type NewLoop = Omit<Loop, 'id' | 'created_at' | 'updated_at'>;
export type NewTask = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type NewMessage = Omit<ChatMessage, 'id' | 'created_at'>;

// --------------------------------
// AI Coach Response Types
// --------------------------------

/**
 * Head Coach Response - from the initial coaching conversation
 */
export interface HeadCoachResponse {
  text: string;              // Coach message text
  title?: string;            // Optional suggested loop title
  summary?: string;          // Optional loop summary
  tasks?: Partial<NewTask>[];// Optional suggested tasks
}

/**
 * Assistant Coach Response - from the loop-specific coach
 */
export interface AssistantCoachResponse {
  text: string;              // Coach message text
  subtasks?: Partial<NewTask>[];      // Optional suggested subtasks
}

// --------------------------------
// UI State Types
// --------------------------------

/**
 * Theme mode options for the UI
 */
export type ThemeMode = 'light' | 'dark' | 'system'; 