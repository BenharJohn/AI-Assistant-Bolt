import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import Plan from '../components/ui/agent-plan';
import { useSettings } from '../context/SettingsContext';

const TaskManager: React.FC = () => {
  const { reducedMotion } = useSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Initial tasks - this will be passed to Plan component
  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Complete History Essay",
      description: "Write a 5-page essay on the Industrial Revolution",
      status: "in-progress",
      priority: "high",
      level: 0,
      dependencies: [],
      subtasks: [
        {
          id: "1.1",
          title: "Research Key Topics",
          description: "Gather information about major inventions and social changes",
          status: "completed",
          priority: "high",
          tools: ["browser", "note-taking"]
        },
        {
          id: "1.2",
          title: "Create Essay Outline",
          description: "Organize main points and supporting evidence",
          status: "in-progress",
          priority: "high",
          tools: ["outline-generator", "mind-map"]
        },
        {
          id: "1.3",
          title: "Write First Draft",
          description: "Complete initial draft focusing on content over perfection",
          status: "pending",
          priority: "medium",
          tools: ["text-editor", "focus-timer"]
        },
        {
          id: "1.4",
          title: "Review and Edit",
          description: "Check for clarity, flow, and historical accuracy",
          status: "pending",
          priority: "medium",
          tools: ["grammar-check", "text-to-speech"]
        }
      ]
    },
    {
      id: "2",
      title: "Math Exam Preparation",
      description: "Study for upcoming calculus exam covering derivatives and integrals",
      status: "need-help",
      priority: "high",
      level: 0,
      dependencies: [],
      subtasks: [
        {
          id: "2.1",
          title: "Review Class Notes",
          description: "Organize and summarize notes from previous lectures",
          status: "in-progress",
          priority: "high",
          tools: ["note-organizer", "math-formatter"]
        },
        {
          id: "2.2",
          title: "Practice Problems",
          description: "Complete practice exercises from textbook",
          status: "need-help",
          priority: "high",
          tools: ["calculator", "step-solver"]
        },
        {
          id: "2.3",
          title: "Watch Tutorial Videos",
          description: "Find and watch explanatory videos for difficult concepts",
          status: "pending",
          priority: "medium",
          tools: ["video-player", "note-taking"]
        }
      ]
    },
    {
      id: "3",
      title: "Daily Reading Assignment",
      description: "Read and comprehend Chapter 5 of 'To Kill a Mockingbird'",
      status: "in-progress",
      priority: "medium",
      level: 0,
      dependencies: [],
      subtasks: [
        {
          id: "3.1",
          title: "Pre-reading Overview",
          description: "Review chapter summary and key themes",
          status: "completed",
          priority: "medium",
          tools: ["text-summarizer", "concept-map"]
        },
        {
          id: "3.2",
          title: "Active Reading",
          description: "Read chapter with text-to-speech assistance",
          status: "in-progress",
          priority: "high",
          tools: ["text-to-speech", "reading-guide"]
        },
        {
          id: "3.3",
          title: "Comprehension Check",
          description: "Answer chapter questions and identify main ideas",
          status: "pending",
          priority: "medium",
          tools: ["quiz-generator", "note-taking"]
        }
      ]
    }
  ]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      status: "pending",
      priority: newTaskPriority,
      level: 0,
      dependencies: [],
      subtasks: [
        {
          id: `${Date.now()}.1`,
          title: "Break down into steps",
          description: "Identify the main components of this task",
          status: "pending",
          priority: newTaskPriority,
          tools: ["task-planner", "mind-map"]
        }
      ]
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setShowAddForm(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: reducedMotion ? 0 : 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.3 }
    }
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
                Manage your tasks and track progress with AI-powered planning
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors duration-200 shadow-soft"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </motion.div>

        {/* Add Task Form Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
                      className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
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
                      className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none"
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
                      className="w-full bg-background border border-appBorder rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
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
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors duration-200 shadow-soft"
                    >
                      Add Task
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Plan - Pass dynamic tasks */}
        <motion.div variants={itemVariants}>
          <div className="bg-card rounded-2xl shadow-warm border border-appBorder overflow-hidden">
            <Plan initialTasks={tasks} onTasksChange={setTasks} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TaskManager;