import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { format } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  steps: Array<{ id: string; text: string; completed: boolean }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'ADD_STEP'; payload: { taskId: string; step: { id: string; text: string; completed: boolean } } }
  | { type: 'COMPLETE_STEP'; payload: { taskId: string; stepId: string } }
  | { type: 'DELETE_STEP'; payload: { taskId: string; stepId: string } }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

const initialTaskState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, status: 'completed', updatedAt: new Date().toISOString() }
            : task
        ),
      };
    case 'ADD_STEP':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                steps: [...task.steps, action.payload.step],
                updatedAt: new Date().toISOString(),
              }
            : task
        ),
      };
    case 'COMPLETE_STEP':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                steps: task.steps.map(step =>
                  step.id === action.payload.stepId
                    ? { ...step, completed: !step.completed }
                    : step
                ),
                updatedAt: new Date().toISOString(),
              }
            : task
        ),
      };
    case 'DELETE_STEP':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                steps: task.steps.filter(step => step.id !== action.payload.stepId),
                updatedAt: new Date().toISOString(),
              }
            : task
        ),
      };
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

const TaskContext = createContext<{
  state: TaskState;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addStep: (taskId: string, stepText: string) => void;
  completeStep: (taskId: string, stepId: string) => void;
  deleteStep: (taskId: string, stepId: string) => void;
} | null>(null);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      dispatch({ type: 'SET_TASKS', payload: JSON.parse(savedTasks) });
    } else {
      // Add sample tasks for demo
      const sampleTasks: Task[] = [
        {
          id: '1',
          title: 'Complete history essay',
          description: 'Write a 5-page essay on the Industrial Revolution',
          dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'high',
          status: 'in-progress',
          steps: [
            { id: '1-1', text: 'Research key inventions', completed: true },
            { id: '1-2', text: 'Create outline', completed: true },
            { id: '1-3', text: 'Write introduction', completed: false },
            { id: '1-4', text: 'Write body paragraphs', completed: false },
            { id: '1-5', text: 'Write conclusion', completed: false },
            { id: '1-6', text: 'Proofread and edit', completed: false },
          ],
          tags: ['school', 'history'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Study for math exam',
          description: 'Review calculus chapters 3-5',
          dueDate: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          priority: 'medium',
          status: 'pending',
          steps: [
            { id: '2-1', text: 'Review derivatives', completed: false },
            { id: '2-2', text: 'Practice integration problems', completed: false },
            { id: '2-3', text: 'Complete practice exam', completed: false },
          ],
          tags: ['school', 'math'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      dispatch({ type: 'SET_TASKS', payload: sampleTasks });
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
  }, [state.tasks]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const updateTask = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const completeTask = (id: string) => {
    dispatch({ type: 'COMPLETE_TASK', payload: id });
  };

  const addStep = (taskId: string, stepText: string) => {
    const step = {
      id: Date.now().toString(),
      text: stepText,
      completed: false,
    };
    dispatch({ type: 'ADD_STEP', payload: { taskId, step } });
  };

  const completeStep = (taskId: string, stepId: string) => {
    dispatch({ type: 'COMPLETE_STEP', payload: { taskId, stepId } });
  };

  const deleteStep = (taskId: string, stepId: string) => {
    dispatch({ type: 'DELETE_STEP', payload: { taskId, stepId } });
  };

  return (
    <TaskContext.Provider
      value={{
        state,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        addStep,
        completeStep,
        deleteStep,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};