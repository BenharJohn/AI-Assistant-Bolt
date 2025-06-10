import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Define the Task type to match your database schema
export interface Task {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  tags: string[] | null;
  parent_task_id: number | null;
  subtasks?: Task[]; // This is added on the frontend after processing
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

const initialState: TaskState = {
  tasks: [],
  loading: true,
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
    const taskMap = new Map(tasks.map(task => [task.id, { ...task, subtasks: [] as Task[] }]));
    const hierarchicalTasks: Task[] = [];
  
    for (const task of taskMap.values()) {
        if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
            taskMap.get(task.parent_task_id)?.subtasks.push(task);
        } else {
            hierarchicalTasks.push(task);
        }
    }
    return hierarchicalTasks;
};

// --- vvv THIS IS THE LINE I FIXED vvv ---
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
// --- ^^^ END OF FIXED LINE ^^^ ---
  const [state, dispatch] = useReducer(taskReducer, initialState);

  useEffect(() => {
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

    fetchAndSetTasks();

    const channel = supabase.channel('realtime tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
        console.log('Realtime change received!', payload);
        fetchAndSetTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTask = async (task: Partial<Task>) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) console.error('Error adding task:', error);
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) console.error('Error updating task:', error);
  };

  const deleteTask = async (id: number) => {
    // Also delete any subtasks associated with this parent task
    await supabase.from('tasks').delete().eq('parent_task_id', id);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  };

  return (
    <TaskContext.Provider value={{ state, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};
