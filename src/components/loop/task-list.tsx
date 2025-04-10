'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import type { Task } from '@/lib/types';

/**
 * TaskList component - displays tasks for a loop with hierarchy
 */
export function TaskList({ loopId }: { loopId: string }) {
  const { tasks, setTasks: _setTasks, toggleTaskCompletion, expandTask, isLoading } = useStore();
  
  useEffect(() => {
    // Fetch tasks for this loop when component mounts
    // Implementation will go here
  }, [loopId]);
  
  const renderTask = (task: Task, level = 0) => {
    const childTasks = tasks.filter((t: Task) => t.parent_id === task.id);
    
    return (
      <div key={task.id} className="py-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={() => toggleTaskCompletion(task.id)}
            className="h-4 w-4"
          />
          <span className={task.is_completed ? 'line-through text-gray-400' : ''}>
            {task.description}
          </span>
          {childTasks.length > 0 && (
            <button
              onClick={() => expandTask(task.id)}
              className="ml-2 text-xs"
            >
              {task.is_expanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
        
        {task.is_expanded && childTasks.length > 0 && (
          <div className="ml-6 mt-1 border-l-2 pl-2">
            {childTasks.map((childTask: Task) => renderTask(childTask, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return <div>Loading tasks...</div>;
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Tasks</h2>
      <div className="space-y-1">
        {tasks.filter((task: Task) => task.parent_id === null).map((task: Task) => renderTask(task))}
      </div>
    </div>
  );
} 