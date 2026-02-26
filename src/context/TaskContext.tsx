import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

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

const STORAGE_KEY = 'aeva_tasks';

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

const loadFromStorage = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    console.error('Failed to save tasks to localStorage');
  }
};

const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;
    if (aPriority !== bPriority) return bPriority - aPriority;

    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const loadTasks = useCallback(() => {
    const flat = loadFromStorage();
    const sorted = sortTasks(flat);
    const hierarchical = buildHierarchy(sorted);
    dispatch({ type: 'SET_TASKS', payload: hierarchical });
  }, []);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    loadTasks();
  }, [loadTasks]);

  const getFlatTasks = (): Task[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const addTask = async (task: Partial<Omit<Task, 'id' | 'created_at' | 'subtasks'>>) => {
    const flat = getFlatTasks();
    const newId = flat.length > 0 ? Math.max(...flat.map(t => t.id)) + 1 : 1;
    const newTask: Task = {
      id: newId,
      created_at: new Date().toISOString(),
      title: task.title || '',
      description: task.description ?? null,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: task.due_date ?? null,
      tags: task.tags ?? null,
      parent_task_id: task.parent_task_id ?? null,
    };
    const updated = [...flat, newTask];
    saveToStorage(updated);
    loadTasks();
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const flat = getFlatTasks();
    const updated = flat.map(t => t.id === id ? { ...t, ...updates } : t);
    saveToStorage(updated);
    loadTasks();
  };

  const deleteTask = async (id: number) => {
    const flat = getFlatTasks();
    const updated = flat.filter(t => t.id !== id && t.parent_task_id !== id);
    saveToStorage(updated);
    loadTasks();
  };

  return (
    <TaskContext.Provider value={{ state, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};
