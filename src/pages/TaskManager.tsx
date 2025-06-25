import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';

const TaskManager: React.FC = () => {
  const { reducedMotion } = useSettings();
  const { state: taskState, addTask } = useTask(); // Use state and functions from our live context
  
  // State for the manual "Add Task" modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // This function now correctly saves to the database via the context
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await addTask({
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      status: 'pending',
    });

    // Reset form fields and close the modal
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setShowAddForm(false);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-foreground">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
              <p className="text-muted-foreground mt-2">Manage your projects and track progress with your AI assistant.</p>
            </div>
            <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center space-x-2">
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
                  <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddTask} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-1">Task Title</label>
                        <input type="text" id="title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Enter task title..." className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-card-foreground mb-1">Description</label>
                        <textarea id="description" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Enter task description..." rows={3} className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none text-foreground" />
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-card-foreground mb-1">Priority</label>
                        <select id="priority" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')} className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium">Cancel</button>
                        <button type="submit" className="btn-primary">Add Task</button>
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
              <p className="text-sm mt-2">Try the "Add Task" button or ask the AI to create a project for you.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TaskManager;
