import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTask, Task } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';

// A reusable Modal Component for both Add and Edit forms
const FormModal: React.FC<{
  title: string;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  children: React.ReactNode;
}> = ({ title, onClose, onSave, children }) => {
  const { reducedMotion } = useSettings();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          {children}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};


const TaskManager: React.FC = () => {
  const { reducedMotion } = useSettings();
  const { state: taskState, addTask, updateTask } = useTask();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use a single state to manage form inputs for both Add and Edit
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
  });

  // When a user clicks the "Edit" button on a TaskCard, this function is called.
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    // Pre-fill the form with the existing task's data
    setFormState({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '', // Format for HTML date input
    });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('Adding task with data:', { ...formState, status: 'pending' });
      await addTask({ 
        title: formState.title.trim(),
        description: formState.description.trim() || null,
        priority: formState.priority,
        due_date: formState.due_date || null,
        status: 'pending'
      });
      
      // Reset form and close modal
      setFormState({ title: '', description: '', priority: 'medium', due_date: '' });
      setShowAddForm(false);
      console.log('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await updateTask(editingTask.id, {
        title: formState.title.trim(),
        description: formState.description.trim() || null,
        priority: formState.priority,
        due_date: formState.due_date || null,
      });
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            <button 
              onClick={() => { 
                setFormState({ title: '', description: '', priority: 'medium', due_date: '' }); 
                setShowAddForm(true); 
              }} 
              className="btn-primary flex items-center space-x-2"
              disabled={isSubmitting}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Adding...' : 'Add Task'}</span>
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showAddForm && (
            <FormModal title="Add New Task" onClose={() => setShowAddForm(false)} onSave={handleAddTask}>
              <label className="block text-sm font-medium text-card-foreground mb-1">Title *</label>
              <input 
                type="text" 
                value={formState.title} 
                onChange={(e) => setFormState({...formState, title: e.target.value})} 
                placeholder="Enter task title..." 
                required 
                disabled={isSubmitting}
                className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50" 
              />
              
              <label className="block text-sm font-medium text-card-foreground mb-1 mt-4">Description</label>
              <textarea 
                value={formState.description} 
                onChange={(e) => setFormState({...formState, description: e.target.value})} 
                placeholder="Description..." 
                rows={3} 
                disabled={isSubmitting}
                className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none disabled:opacity-50" 
              />
              
              <label className="block text-sm font-medium text-card-foreground mb-1 mt-4">Priority</label>
              <select 
                value={formState.priority} 
                onChange={(e) => setFormState({...formState, priority: e.target.value as any})} 
                disabled={isSubmitting}
                className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              
              <label className="block text-sm font-medium text-card-foreground mb-1 mt-4">Due Date</label>
              <input 
                type="date" 
                value={formState.due_date} 
                onChange={(e) => setFormState({...formState, due_date: e.target.value})} 
                disabled={isSubmitting}
                className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50" 
              />
            </FormModal>
          )}
          {editingTask && (
             <FormModal title="Edit Task" onClose={() => setEditingTask(null)} onSave={handleUpdateTask}>
                <label className="block text-sm font-medium text-card-foreground mb-1">Title *</label>
                <input 
                  type="text" 
                  value={formState.title} 
                  onChange={(e) => setFormState({...formState, title: e.target.value})} 
                  placeholder="Task title..." 
                  required 
                  disabled={isSubmitting}
                  className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50" 
                />
                
                <label className="block text-sm font-medium text-card-foreground mb-1 mt-4">Description</label>
                <textarea 
                  value={formState.description} 
                  onChange={(e) => setFormState({...formState, description: e.target.value})} 
                  placeholder="Description..." 
                  rows={3} 
                  disabled={isSubmitting}
                  className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none disabled:opacity-50" 
                />
                
                <label className="block text-sm font-medium text-card-foreground mb-1 mt-4">Priority</label>
                <select 
                  value={formState.priority} 
                  onChange={(e) => setFormState({...formState, priority: e.target.value as any})} 
                  disabled={isSubmitting}
                  className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                
                <label className="block text-sm font-medium text-card-foreground mb-1 mt-4">Due Date</label>
                <input 
                  type="date" 
                  value={formState.due_date} 
                  onChange={(e) => setFormState({...formState, due_date: e.target.value})} 
                  disabled={isSubmitting}
                  className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50" 
                />
            </FormModal>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="space-y-6 mt-8">
          {taskState.loading ? (
            <p className="text-muted-foreground text-center animate-pulse">Loading tasks...</p>
          ) : taskState.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">Error loading tasks</p>
              <p className="text-red-500 dark:text-red-300 text-sm mt-1">{taskState.error}</p>
            </div>
          ) : taskState.tasks.length > 0 ? (
            taskState.tasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={handleOpenEditModal} />
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