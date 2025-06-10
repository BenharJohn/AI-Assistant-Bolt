import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure you have the supabase client

// 1. UPDATE THE TASK TYPE
// Add `parent_task_id` and an optional `subtasks` array.
export interface Task {
  id: number; // Supabase uses numbers for auto-incrementing IDs
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  parent_task_id: number | null; // This is the new column
  subtasks?: Task[]; // This will be added on the frontend
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// Your reducer can stay mostly the same, but we will simplify how we use it.
type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

const initialState: TaskState = {
  tasks: [],
  loading: true, // Start in a loading state
  error: null,
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// We will simplify the context value as most actions will now happen directly on the database
const TaskContext = createContext<{
  state: TaskState;
  addTask: (task: Partial<Task>) => Promise<any>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<any>;
  deleteTask: (id: number) => Promise<any>;
} | null>(null);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// Helper function to build the task hierarchy from a flat list
const buildHierarchy = (tasks: Task[]): Task[] => {
    const taskMap = new Map(tasks.map(task => [task.id, { ...task, subtasks: [] }]));
    const hierarchicalTasks: Task[] = [];
  
    for (const task of taskMap.values()) {
        if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
            // It's a subtask, add it to its parent's subtask array
            taskMap.get(task.parent_task_id)?.subtasks.push(task);
        } else {
            // It's a parent task, add it to the main list
            hierarchicalTasks.push(task);
        }
    }
    return hierarchicalTasks;
};


export const TaskProvider: React.FC<{ children: React.ReactNode }> => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // 2. THIS IS THE NEW CORE LOGIC
  useEffect(() => {
    // Function to fetch all tasks and build the hierarchy
    const fetchAndSetTasks = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        const hierarchicalTasks = buildHierarchy(data || []);
        dispatch({ type: 'SET_TASKS', payload: hierarchicalTasks });
      }
    };

    // Fetch the initial data when the component mounts
    fetchAndSetTasks();

    // Set up a Supabase real-time subscription
    const channel = supabase.channel('realtime tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
        console.log('Realtime change received!', payload);
        // When any change happens, refetch all tasks to rebuild the hierarchy.
        // This is the simplest way to ensure the UI is always in sync.
        fetchAndSetTasks();
      })
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // The empty array ensures this effect runs only once

  // 3. UPDATE CONTEXT FUNCTIONS TO USE SUPABASE
  const addTask = async (task: Partial<Task>) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) console.error('Error adding task:', error);
    // We don't need to dispatch here; the realtime listener will catch the change.
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) console.error('Error updating task:', error);
  };

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  };


  return (
    <TaskContext.Provider value={{ state, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};
