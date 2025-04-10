import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Loop, Task, ChatMessage, NewLoop, NewTask, NewMessage } from '@/lib/types';

// Store test client reference
let testClient: SupabaseClient | null = null;

// --------------------------------
// Client Initialization
// --------------------------------

/**
 * Create a Supabase client for browser usage
 */
export function getSupabaseClient(): SupabaseClient {
  // If a test client is available, use that instead
  if (testClient) {
    return testClient;
  }
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Set a test client for database operations
 * Used only during testing to bypass auth
 */
export function setTestClient(client: SupabaseClient) {
  testClient = client;
}

// --------------------------------
// Error Handling
// --------------------------------

/**
 * Custom database error class
 */
export class DbError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DbError';
  }
}

// --------------------------------
// Loop Operations
// --------------------------------

/**
 * Create a new loop
 * @param data The loop data to create
 * @returns The created loop
 */
export async function createLoop(data: Partial<NewLoop>): Promise<Loop> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: loop, error } = await supabase
      .from('loops')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw error;
    if (!loop) throw new Error('Failed to create loop');
    
    return loop as Loop;
  } catch (err) {
    console.error('Error creating loop:', err);
    throw new DbError('Failed to create loop', err);
  }
}

/**
 * Get a loop by ID
 * @param id The loop ID
 * @returns The loop or null if not found
 */
export async function getLoopById(id: string): Promise<Loop | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: loop, error } = await supabase
      .from('loops')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw error;
    }
    
    return loop as Loop;
  } catch (err) {
    console.error(`Error fetching loop ${id}:`, err);
    throw new DbError(`Failed to fetch loop ${id}`, err);
  }
}

/**
 * Get all loops for a user
 * @param userId The user ID
 * @returns Array of loops
 */
export async function getUserLoops(userId: string): Promise<Loop[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: loops, error } = await supabase
      .from('loops')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return loops as Loop[];
  } catch (err) {
    console.error(`Error fetching loops for user ${userId}:`, err);
    throw new DbError(`Failed to fetch loops for user ${userId}`, err);
  }
}

/**
 * Update a loop
 * @param id The loop ID
 * @param updates The fields to update
 * @returns The updated loop
 */
export async function updateLoop(id: string, updates: Partial<Loop>): Promise<Loop> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: loop, error } = await supabase
      .from('loops')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    if (!loop) throw new Error(`Loop ${id} not found`);
    
    return loop as Loop;
  } catch (err) {
    console.error(`Error updating loop ${id}:`, err);
    throw new DbError(`Failed to update loop ${id}`, err);
  }
}

/**
 * Delete a loop
 * @param id The loop ID
 * @returns True if successful
 */
export async function deleteLoop(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('loops')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error(`Error deleting loop ${id}:`, err);
    throw new DbError(`Failed to delete loop ${id}`, err);
  }
}

// --------------------------------
// Task Operations
// --------------------------------

/**
 * Create a task
 * @param data The task data
 * @returns The created task
 */
export async function createTask(data: Partial<NewTask>): Promise<Task> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw error;
    if (!task) throw new Error('Failed to create task');
    
    return task as Task;
  } catch (err) {
    console.error('Error creating task:', err);
    throw new DbError('Failed to create task', err);
  }
}

/**
 * Create multiple tasks for a loop
 * @param tasks Array of tasks to create (without ids)
 * @returns Array of created tasks
 */
export async function createTasks(tasks: Partial<NewTask>[]): Promise<Task[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select('*');
      
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create tasks');
    
    return data as Task[];
  } catch (err) {
    console.error('Error creating tasks:', err);
    throw new DbError('Failed to create tasks', err);
  }
}

/**
 * Get tasks for a loop
 * @param loopId The loop ID
 * @returns Array of tasks
 */
export async function getLoopTasks(loopId: string): Promise<Task[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('loop_id', loopId)
      .order('position', { ascending: true });
      
    if (error) throw error;
    
    return tasks as Task[];
  } catch (err) {
    console.error(`Error fetching tasks for loop ${loopId}:`, err);
    throw new DbError(`Failed to fetch tasks for loop ${loopId}`, err);
  }
}

/**
 * Update a task
 * @param id The task ID
 * @param updates The fields to update
 * @returns The updated task
 */
export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    if (!task) throw new Error(`Task ${id} not found`);
    
    return task as Task;
  } catch (err) {
    console.error(`Error updating task ${id}:`, err);
    throw new DbError(`Failed to update task ${id}`, err);
  }
}

/**
 * Toggle task completion status
 * @param id The task ID
 * @returns The updated task
 */
export async function toggleTaskCompletion(id: string): Promise<Task> {
  const supabase = getSupabaseClient();
  
  try {
    // First get the current task to check its completion status
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    if (!currentTask) throw new Error(`Task ${id} not found`);
    
    // Now toggle the completion status
    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update({ 
        is_completed: !currentTask.is_completed,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select('*')
      .single();
      
    if (updateError) throw updateError;
    if (!task) throw new Error(`Task ${id} not found after update`);
    
    return task as Task;
  } catch (err) {
    console.error(`Error toggling task ${id} completion:`, err);
    throw new DbError(`Failed to toggle task ${id} completion`, err);
  }
}

/**
 * Update task expansion state (UI state for collapsible items)
 * @param id The task ID
 * @param isExpanded Whether the task is expanded
 * @returns The updated task
 */
export async function updateTaskExpansion(id: string, isExpanded: boolean): Promise<Task> {
  return updateTask(id, { is_expanded: isExpanded });
}

/**
 * Delete a task
 * @param id The task ID
 * @returns True if successful
 */
export async function deleteTask(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error(`Error deleting task ${id}:`, err);
    throw new DbError(`Failed to delete task ${id}`, err);
  }
}

// --------------------------------
// Message Operations
// --------------------------------

/**
 * Add a message to a conversation
 * @param message The message data
 * @returns The created message
 */
export async function createMessage(message: Partial<NewMessage>): Promise<ChatMessage> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select('*')
      .single();
      
    if (error) throw error;
    if (!data) throw new Error('Failed to create message');
    
    return data as ChatMessage;
  } catch (err) {
    console.error('Error creating message:', err);
    throw new DbError('Failed to create message', err);
  }
}

/**
 * Get all messages for a loop
 * @param loopId The loop ID
 * @returns Array of messages
 */
export async function getLoopMessages(loopId: string): Promise<ChatMessage[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('loop_id', loopId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    return data as ChatMessage[];
  } catch (err) {
    console.error(`Error fetching messages for loop ${loopId}:`, err);
    throw new DbError(`Failed to fetch messages for loop ${loopId}`, err);
  }
}

/**
 * Delete messages for a loop
 * @param loopId The loop ID
 * @returns True if successful
 */
export async function deleteLoopMessages(loopId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('loop_id', loopId);
      
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error(`Error deleting messages for loop ${loopId}:`, err);
    throw new DbError(`Failed to delete messages for loop ${loopId}`, err);
  }
} 