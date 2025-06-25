import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useTask } from '../context/TaskContext'; // ADDED
import { useSettings } from '../context/SettingsContext';
import Plan from '../components/ui/agent-plan';

const TaskManager: React.FC = () => {
  const { reducedMotion } = useSettings();
  const { addTask } = useTask(); // ADDED: Context integration
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // MODIFIED: Now uses context
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle,
      description: newTaskDescription,
      dueDate: null,
      priority: newTaskPriority,
      status: 'pending',
      steps: [],
      tags: []
    });

    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setShowAddForm(false);
  };

  // ... existing variants and JSX ...

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      {/* Header - UNCHANGED */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        {/* ... existing header JSX ... */}
      </motion.div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            onSubmit={handleAddTask}
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-xl p-6 space-y-4 border border-appBorder"
          >
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Task Title
              </label>
              <input
                type="text"
                id="title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="input-warm w-full"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="input-warm w-full min-h-[100px]"
                placeholder="Add details..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Priority</label>
              <div className="flex space-x-4">
                {['high', 'medium', 'low'].map((priority) => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="radio"
                      name="priority"
                      checked={newTaskPriority === priority}
                      onChange={() => setNewTaskPriority(priority as any)}
                      className="sr-only"
                    />
                    <span
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        newTaskPriority === priority
                          ? priority === 'high'
                            ? 'bg-red-500 text-white'
                            : priority === 'medium'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Plan component remains UNCHANGED */}
      <Plan tasks={[]} />
    </motion.div>
  );
};

export default TaskManager;
