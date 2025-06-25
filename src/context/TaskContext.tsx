import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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
    dispatch({ type: 'SET_LOADING', payload: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('status', { ascending: true }) 
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } else {
      const hierarchicalTasks = buildHierarchy(data || []);
      dispatch({ type: 'SET_TASKS', payload: hierarchicalTasks });
    }
  }, []);

  useEffect(() => {
    fetchAndSetTasks();

    const channel = supabase.channel('realtime tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
          console.log('Realtime change received! Refetching tasks.', payload);
          fetchAndSetTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAndSetTasks]);

  // --- vvv THIS IS THE FIX vvv ---
  // The addTask, updateTask, and deleteTask functions now manually call 
  // fetchAndSetTasks after a successful database operation.
  // This guarantees the UI updates instantly for manual actions.
  const addTask = async (task: Partial<Omit<Task, 'id' | 'created_at' | 'subtasks'>>) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) console.error('Error updating task:', error);
  };

  const deleteTask = async (id: number) => {
    await supabase.from('tasks').delete().eq('parent_task_id', id);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
  };
  // --- ^^^ END OF FIX ^^^ ---

  return (
    <TaskContext.Provider value={{ state, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};
import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Task, useTask } from '../context/TaskContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void; // Function passed from TaskManager to open the edit modal
}

// A smaller component for rendering subtasks cleanly
const SubtaskItem: React.FC<{ subtask: Task }> = ({ subtask }) => {
    const { updateTask } = useTask();

    // Toggling a subtask's completion status
    const handleToggle = () => {
        const newStatus = subtask.status === 'completed' ? 'in-progress' : 'completed';
        updateTask(subtask.id, { status: newStatus });
    };

    return (
        <div className="flex items-center space-x-3 pl-8 pr-4 py-2 border-t border-appBorder/50">
            <button onClick={handleToggle} className="transition-transform hover:scale-110 flex-shrink-0">
                {subtask.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-secondary" />
                ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                )}
            </button>
            <p className={`text-sm flex-grow ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {subtask.title}
            </p>
        </div>
    );
};


const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { updateTask, deleteTask } = useTask();
  const { reducedMotion } = useSettings();
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Toggling a parent task's completion status
  const handleToggle = () => {
    const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
    updateTask(task.id, { status: newStatus });
  };
  
  // Helper functions for styling
  const getPriorityClasses = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-primary bg-primary/5';
      case 'medium': return 'border-secondary bg-secondary/5';
      case 'low': return 'border-muted-foreground/50 bg-muted/20';
      default: return 'border-appBorder bg-card';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-primary" />;
      case 'medium': return <Clock className="w-4 h-4 text-secondary" />;
      case 'low': return <Circle className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`rounded-2xl border-2 transition-all duration-200 shadow-soft hover:shadow-warm ${getPriorityClasses(task.priority)}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <button
              onClick={handleToggle}
              className="mt-1 transition-transform hover:scale-110"
              aria-label={`Mark task ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
            >
              {task.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-secondary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              )}
            </button>
            
            <div className="flex-1">
              <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                {task.priority && (
                  <div className="flex items-center space-x-1">
                    {getPriorityIcon(task.priority)}
                    <span className="text-xs font-medium capitalize text-muted-foreground">
                      {task.priority}
                    </span>
                  </div>
                )}
                
                {task.due_date && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock size={12} />
                    <span className="text-xs">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
              {task.subtasks && task.subtasks.length > 0 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                    {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
              )}
              <button
                onClick={() => onEdit(task)}
                aria-label="Edit task"
                className="text-muted-foreground hover:text-secondary transition-colors duration-200"
              >
                  <Pencil size={16} />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <X size={16}/>
              </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && task.subtasks && task.subtasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            className="border-t-2 border-appBorder bg-background/50 overflow-hidden"
          >
              <div className="py-2">
                  {task.subtasks.map(subtask => (
                      <SubtaskItem key={subtask.id} subtask={subtask} />
                  ))}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskCard;
