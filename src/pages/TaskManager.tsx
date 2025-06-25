import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';

const TaskManager: React.FC = () => {
  const { reducedMotion } = useSettings();
  const { state: taskState, addTask: addTaskToDb } = useTask();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await addTaskToDb({
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      status: 'pending',
    });

    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setShowAddForm(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reducedMotion ? 0 : 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.3 } }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-foreground">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
              <p className="text-muted-foreground mt-2">
                Manage your projects and track progress with your AI assistant.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors duration-200 shadow-soft"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
                className="bg-card rounded-2xl shadow-warm border border-appBorder p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-card-foreground">Add New Task</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-card-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Enter task description..."
                      rows={3}
                      className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none text-foreground"
                    />
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-card-foreground mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 text-foreground"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors duration-200 shadow-soft font-medium"
                    >
                      Add Task
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="space-y-6 mt-8">
          {taskState.loading ? (
            <p className="text-muted-foreground text-center animate-pulse">Loading tasks...</p>
          ) : taskState.tasks.length > 0 ? (
            taskState.tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground">
              <p className="font-medium">No tasks yet. Ready to get started?</p>
              <p className="text-sm mt-2">Try asking your AI assistant: "Create a project to plan my birthday party for next month."</p>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
};

export default TaskManager;
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
