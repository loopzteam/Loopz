import { create } from 'zustand';
import type { User, Loop, Task } from '@/lib/types';

// --------------------------------
// Auth Slice
// --------------------------------

interface AuthSlice {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setAuthLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

// --------------------------------
// Loop Slice
// --------------------------------

interface LoopSlice {
  loops: Loop[];
  currentLoopId: string | null;
  isLoading: boolean;
  error: string | null;
  setLoops: (loops: Loop[]) => void;
  addLoop: (loop: Loop) => void;
  updateLoop: (loop: Loop) => void;
  setCurrentLoopId: (id: string | null) => void;
  setLoopLoading: (isLoading: boolean) => void;
  setLoopError: (error: string | null) => void;
}

// --------------------------------
// Task Slice
// --------------------------------

interface TaskSlice {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  expandTask: (taskId: string) => void;
  setTaskLoading: (isLoading: boolean) => void;
  setTaskError: (error: string | null) => void;
}

// --------------------------------
// UI Slice
// --------------------------------

type ThemeMode = 'light' | 'dark' | 'system';

interface UISlice {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

// --------------------------------
// Combined Store
// --------------------------------

export const useStore = create<AuthSlice & LoopSlice & TaskSlice & UISlice>((set) => ({
  // Auth state
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setAuthLoading: (isLoading) => set({ isLoading }),
  setAuthError: (error) => set({ error }),
  
  // Loop state
  loops: [],
  currentLoopId: null,
  setLoops: (loops) => set({ loops }),
  addLoop: (loop) => set((state) => ({ loops: [...state.loops, loop] })),
  updateLoop: (loop) => set((state) => ({ 
    loops: state.loops.map(l => l.id === loop.id ? loop : l) 
  })),
  setCurrentLoopId: (id) => set({ currentLoopId: id }),
  setLoopLoading: (isLoading) => set({ isLoading }),
  setLoopError: (error) => set({ error }),
  
  // Task state
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    )
  })),
  toggleTaskCompletion: (taskId) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === taskId ? { ...task, is_completed: !task.is_completed } : task
    )
  })),
  expandTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === taskId ? { ...task, is_expanded: !task.is_expanded } : task
    )
  })),
  setTaskLoading: (isLoading) => set({ isLoading }),
  setTaskError: (error) => set({ error }),
  
  // UI state
  theme: 'system',
  setTheme: (theme) => set({ theme }),
})); 