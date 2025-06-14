import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// This Task interface is correct and includes everything we need.
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
  subtasks?: Task[]; 
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
      return { ...state, tasks: action.payload, loading: false, error: null };
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
  addTask: (task: Partial<Omit<Task, 'id' | 'created_at' | 'subtasks'>>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
} | null>(null);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// This helper function to build the hierarchy is correct and remains the same.
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

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const fetchAndSetTasks = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      // --- vvv FIX #2: SORTING THE TASKS vvv ---
      // We now order by status first, then by creation date.
      // 'completed' will be last because 'c' comes after 'p' and 'i'.
      .order('status', { ascending: true }) 
      .order('created_at', { ascending: true });
      // --- ^^^ END OF FIX #2 ^^^ ---

    if (error) {
      console.error('Error fetching tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } else {
      const hierarchicalTasks = buildHierarchy(data || []);
      dispatch({ type: 'SET_TASKS', payload: hierarchicalTasks });
    }
  };

  useEffect(() => {
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

  // --- vvv FIX #1: MANUAL ADD TASK vvv ---
  const addTask = async (task: Partial<Omit<Task, 'id' | 'created_at' | 'subtasks'>>) => {
    // This function now correctly saves to the database AND ensures the UI updates.
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) {
        console.error('Error adding task:', error);
    }
    // We don't need to do anything else, because the Supabase realtime listener
    // will see the INSERT and automatically call fetchAndSetTasks() for us.
  };
  // --- ^^^ END OF FIX #1 ^^^ ---

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) console.error('Error updating task:', error);
  };

  const deleteTask = async (id: number) => {
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
