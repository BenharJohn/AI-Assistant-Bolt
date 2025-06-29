import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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
  if (!context) throw new Error('useTask must be used within a TaskProvider');
  return context;
};

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

  const fetchAndSetTasks = useCallback(async () => {
    // We don't set loading to true here because the realtime listener can call this frequently.
    // We only want to show the main loading indicator on the initial load.
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('status', { 
        ascending: true
      })
      .order('priority', { 
        ascending: false
      })
      .order('due_date', { 
        ascending: true,
        nullsFirst: false
      })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } else {
      // Apply additional custom sorting to ensure the exact order we want
      const sortedData = (data || []).sort((a, b) => {
        // 1. First sort by completion status (incomplete tasks first)
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // 2. For tasks with the same completion status, sort by priority
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // 3. For tasks with same status and priority, sort by due date (sooner first)
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1; // Tasks with due dates come first
        if (!a.due_date && b.due_date) return 1;
        
        // 4. Finally, sort by creation date (newer first for better UX)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const hierarchicalTasks = buildHierarchy(sortedData);
      dispatch({ type: 'SET_TASKS', payload: hierarchicalTasks });
    }
  }, []);

  useEffect(() => {
    // Set loading to true only on the very first load.
    dispatch({ type: 'SET_LOADING', payload: true });
    fetchAndSetTasks();

    const channel = supabase.channel('realtime tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
          console.log('Realtime change received! Refetching tasks.', payload);
          // When a change is detected by the realtime listener (e.g., from the AI), refetch.
          fetchAndSetTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAndSetTasks]);

  // --- vvv THIS IS THE FIX vvv ---
  // These functions now manually call fetchAndSetTasks after a successful
  // database operation to guarantee the UI updates instantly for manual actions.
  const addTask = async (task: Partial<Omit<Task, 'id' | 'created_at' | 'subtasks'>>) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) {
      console.error('Error adding task:', error);
    } else {
      await fetchAndSetTasks(); // Manually refresh the UI
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating task:', error);
    } else {
       await fetchAndSetTasks(); // Manually refresh the UI
    }
  };

  const deleteTask = async (id: number) => {
    await supabase.from('tasks').delete().eq('parent_task_id', id);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
    } else {
       await fetchAndSetTasks(); // Manually refresh the UI
    }
  };
  // --- ^^^ END OF FIX ^^^ ---

  return (
    <TaskContext.Provider value={{ state, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};