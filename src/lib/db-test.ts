/**
 * Database operations test script
 * 
 * This file contains test functions for validating database operations.
 * It can be run from a component or page during development.
 */

import * as db from './db';
import type { Loop, Task, ChatMessage, NewLoop, NewTask, NewMessage } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Store test data IDs to clean up later
let testLoopId: string | null = null;
let testTaskIds: string[] = [];
let testMessageId: string | null = null;

// Test user ID - replace with a real user ID from your database
const TEST_USER_ID = '7de1278b-fe2a-42a1-b1da-13be5c457dd7';

// Store the Supabase client instance passed from test page
let supabaseClient: SupabaseClient | null = null;

/**
 * Run all database tests in sequence
 */
export async function runDatabaseTests(client?: SupabaseClient) {
  console.log('🧪 Starting database tests...');
  
  // Store the client if provided
  if (client) {
    console.log('Using provided Supabase client');
    supabaseClient = client;
  }
  
  try {
    // Check schema first
    await checkDatabaseSchema();
    
    // Connection test
    await testConnection();
    
    // Loop CRUD tests
    const createdLoop = await testCreateLoop();
    testLoopId = createdLoop.id;
    
    await testGetLoop(createdLoop.id);
    await testUpdateLoop(createdLoop.id);
    
    // Task tests
    const parentTask = await testCreateTask(createdLoop.id);
    testTaskIds.push(parentTask.id);
    
    const childTasks = await testCreateChildTasks(createdLoop.id, parentTask.id);
    testTaskIds.push(...childTasks.map(task => task.id));
    
    await testGetTasks(createdLoop.id);
    await testToggleTaskCompletion(parentTask.id);
    
    // Message tests
    const message = await testCreateMessage(createdLoop.id, parentTask.id);
    testMessageId = message.id;
    
    await testGetMessages(createdLoop.id);
    
    // Error handling test
    await testErrorHandling();
    
    // Clean up all test data
    await cleanupTestData();
    
    console.log('✅ All database tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Attempt to clean up even if tests fail
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('Failed to clean up test data:', cleanupError);
    }
  }
}

/**
 * Check the database schema to understand table structure
 */
async function checkDatabaseSchema() {
  console.log('Checking database schema...');
  
  try {
    const supabase = supabaseClient || db.getSupabaseClient();
    
    // Check loops table
    const { data: loops, error: loopsError } = await supabase
      .from('loops')
      .select('*')
      .limit(1);
    
    if (loopsError) {
      console.error('Schema check error (loops):', loopsError);
      throw loopsError;
    }
    
    if (loops && loops.length > 0) {
      const columns = Object.keys(loops[0]);
      console.log('✅ Loops table structure:', columns.join(', '));
    } else {
      console.log('ℹ️ Loops table exists but is empty');
    }
    
    // Check tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
      
    if (tasksError) {
      console.error('Schema check error (tasks):', tasksError);
      throw tasksError;
    }
    
    if (tasks && tasks.length > 0) {
      const columns = Object.keys(tasks[0]);
      console.log('✅ Tasks table structure:', columns.join(', '));
    } else {
      console.log('ℹ️ Tasks table exists but is empty');
    }
    
    // Check messages table
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
      
    if (messagesError) {
      console.error('Schema check error (messages):', messagesError);
      throw messagesError;
    }
    
    if (messages && messages.length > 0) {
      const columns = Object.keys(messages[0]);
      console.log('✅ Messages table structure:', columns.join(', '));
    } else {
      console.log('ℹ️ Messages table exists but is empty');
    }
    
    return true;
  } catch (error) {
    logError('Schema check', error);
    throw error;
  }
}

/**
 * Utility function to log errors in a consistent format
 */
function logError(context: string, error: any): void {
  console.error(`❌ ${context} failed:`, error);
  
  // Log additional details for Supabase errors
  if (error && error.code) {
    console.error(`Error code: ${error.code}`);
  }
  
  if (error && error.details) {
    console.error(`Error details: ${error.details}`);
  }
  
  if (error && error.hint) {
    console.error(`Error hint: ${error.hint}`);
  }
  
  if (error && error.message) {
    console.error(`Error message: ${error.message}`);
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    // Use getUserLoops as a simple connection test
    await db.getUserLoops(TEST_USER_ID);
    console.log('✅ Database connection successful');
  } catch (error) {
    logError('Database connection', error);
    throw error;
  }
}

/**
 * Test creating a loop
 */
async function testCreateLoop(): Promise<Loop> {
  console.log('Testing loop creation...');
  
  const newLoop: Partial<NewLoop> = {
    user_id: TEST_USER_ID,
    title: 'Test Loop',
    summary: 'Test loop summary'
  };
  
  console.log('Attempting to create loop with:', newLoop);
  
  try {
    const loop = await db.createLoop(newLoop);
    console.log('✅ Loop created:', loop.id);
    return loop;
  } catch (error) {
    logError('Loop creation', error);
    throw error;
  }
}

/**
 * Test getting a loop by ID
 */
async function testGetLoop(id: string): Promise<Loop> {
  console.log(`Testing getting loop with ID ${id}...`);
  
  try {
    const loop = await db.getLoopById(id);
    
    if (!loop) {
      throw new Error(`Loop with ID ${id} not found`);
    }
    
    console.log('✅ Loop retrieved successfully');
    return loop;
  } catch (error) {
    logError('Loop retrieval', error);
    throw error;
  }
}

/**
 * Test updating a loop
 */
async function testUpdateLoop(id: string): Promise<Loop> {
  console.log(`Testing updating loop with ID ${id}...`);
  
  const updates = {
    title: 'Updated Test Loop',
    summary: 'This is a test summary'
  };
  
  try {
    const updatedLoop = await db.updateLoop(id, updates);
    console.log('✅ Loop updated successfully');
    
    if (updatedLoop.title !== updates.title || updatedLoop.summary !== updates.summary) {
      throw new Error('Loop update did not apply all changes');
    }
    
    return updatedLoop;
  } catch (error) {
    logError('Loop update', error);
    throw error;
  }
}

/**
 * Test creating a task
 */
async function testCreateTask(loopId: string): Promise<Task> {
  console.log(`Testing task creation for loop ${loopId}...`);
  
  const newTask: Partial<NewTask> = {
    loop_id: loopId,
    parent_id: null,
    title: 'Parent test task',
    is_completed: false,
    is_expanded: true,
    position: 1
  };
  
  console.log('Attempting to create task:', newTask);
  
  try {
    const task = await db.createTask(newTask);
    console.log('✅ Task created:', task.id);
    return task;
  } catch (error) {
    logError('Task creation', error);
    throw error;
  }
}

/**
 * Test creating child tasks
 */
async function testCreateChildTasks(loopId: string, parentId: string): Promise<Task[]> {
  console.log(`Testing child task creation for parent ${parentId}...`);
  
  const childTasks: Partial<NewTask>[] = [
    {
      loop_id: loopId,
      parent_id: parentId,
      title: 'Child test task 1',
      is_completed: false,
      is_expanded: false,
      position: 1
    },
    {
      loop_id: loopId,
      parent_id: parentId,
      title: 'Child test task 2',
      is_completed: false,
      is_expanded: false,
      position: 2
    }
  ];
  
  console.log('Attempting to create child tasks:', childTasks);
  
  try {
    const tasks = await db.createTasks(childTasks);
    console.log(`✅ ${tasks.length} child tasks created`);
    return tasks;
  } catch (error) {
    logError('Child task creation', error);
    throw error;
  }
}

/**
 * Test getting tasks for a loop
 */
async function testGetTasks(loopId: string): Promise<Task[]> {
  console.log(`Testing getting tasks for loop ${loopId}...`);
  
  try {
    const tasks = await db.getLoopTasks(loopId);
    console.log(`✅ Retrieved ${tasks.length} tasks`);
    
    // Verify parent-child relationships
    const parentTasks = tasks.filter(task => task.parent_id === null);
    const childTasks = tasks.filter(task => task.parent_id !== null);
    
    console.log(`Found ${parentTasks.length} parent tasks and ${childTasks.length} child tasks`);
    
    return tasks;
  } catch (error) {
    logError('Task retrieval', error);
    throw error;
  }
}

/**
 * Test toggling task completion
 */
async function testToggleTaskCompletion(taskId: string): Promise<Task> {
  console.log(`Testing toggling completion for task ${taskId}...`);
  
  try {
    const updatedTask = await db.toggleTaskCompletion(taskId);
    console.log(`✅ Task completion toggled to ${updatedTask.is_completed}`);
    return updatedTask;
  } catch (error) {
    logError('Task toggle', error);
    throw error;
  }
}

/**
 * Test creating a message
 */
async function testCreateMessage(loopId: string, taskId: string): Promise<ChatMessage> {
  console.log(`Testing message creation for loop ${loopId}...`);
  
  const newMessage: Partial<NewMessage> = {
    loop_id: loopId,
    task_id: taskId,
    role: 'user',
    content: 'This is a test message'
  };
  
  console.log('Attempting to create message:', newMessage);
  
  try {
    const message = await db.createMessage(newMessage);
    console.log('✅ Message created:', message.id);
    return message;
  } catch (error) {
    logError('Message creation', error);
    throw error;
  }
}

/**
 * Test getting messages for a loop
 */
async function testGetMessages(loopId: string): Promise<ChatMessage[]> {
  console.log(`Testing getting messages for loop ${loopId}...`);
  
  try {
    const messages = await db.getLoopMessages(loopId);
    console.log(`✅ Retrieved ${messages.length} messages`);
    return messages;
  } catch (error) {
    logError('Message retrieval', error);
    throw error;
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('Testing error handling...');
  
  try {
    // Try to get a loop with an invalid ID
    const invalidLoopId = '00000000-0000-0000-0000-000000000000';
    const loop = await db.getLoopById(invalidLoopId);
    
    console.log('Got result:', loop);
    
    if (loop === null) {
      console.log('✅ Error handling works - returned null for non-existent loop');
    } else {
      throw new Error('Error handling test failed - should have returned null');
    }
    
    // Try to update a non-existent loop (should throw)
    try {
      await db.updateLoop(invalidLoopId, { title: 'This should fail' });
      throw new Error('Error handling test failed - should have thrown an error');
    } catch (error) {
      if (error instanceof db.DbError) {
        console.log('✅ DbError correctly thrown for invalid operation');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    logError('Error handling test', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('Cleaning up test data...');
  
  try {
    // Delete tasks
    for (const taskId of testTaskIds) {
      await db.deleteTask(taskId);
    }
    console.log('✅ Test tasks deleted');
    
    // Delete messages
    if (testLoopId) {
      await db.deleteLoopMessages(testLoopId);
    }
    
    // Delete loop
    if (testLoopId) {
      await db.deleteLoop(testLoopId);
    }
    
    console.log('✅ All test data cleaned up successfully');
  } catch (error) {
    console.error('Failed to clean up test data:', error);
    throw error;
  }
}