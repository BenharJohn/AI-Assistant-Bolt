//dashboard
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Book, CalendarClock, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import AIAssistant from '../components/AIAssistant';
import LiveVoiceShape from '../components/LiveVoiceShape';
import BoltBadge from '../components/BoltBadge';
import { useSettings } from '../context/SettingsContext';
import { format, isToday, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useTask();
  const { reducedMotion } = useSettings();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const today = new Date();

  // Calculate stats based on actual database fields
  const allTasks = state.tasks || [];
  const incompleteTasks = allTasks.filter(task => task.status !== 'completed');
  const totalTasks = incompleteTasks.length;

  // Count tasks completed today (checking created_at since we don't have updated_at)
  const completedTasks = allTasks.filter(task => task.status === 'completed');
  const completedToday = completedTasks.filter(task => {
    try {
      return isToday(parseISO(task.created_at));
    } catch {
      return false;
    }
  }).length;

  // Calculate completion rate
  const totalDailyTasks = totalTasks + completedToday;
  const completionRate = totalDailyTasks > 0 
    ? Math.round((completedToday / totalDailyTasks) * 100) 
    : 0;

  // Get priority tasks (high priority or due soon) using correct field names
  const priorityTasks = incompleteTasks.filter(task => {
    if (task.priority === 'high') return true;
    
    if (task.due_date) {
      try {
        const dueDate = parseISO(task.due_date);
        const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
        return dueDate <= twoDaysFromNow;
      } catch {
        return false;
      }
    }
    
    return false;
  }).slice(0, 3);

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

  const greetingMessage = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const iconPrimaryColor = "text-primary";
  const iconSecondaryColor = "text-secondary";
  const iconAccentColor = "text-accent";

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Bolt.new Badge - Fixed positioning to avoid logo overlap on mobile */}
      <div className="fixed top-4 right-4 z-20">
        <BoltBadge size="md" className="shadow-lg" />
      </div>

      {/* Main Content Container - Centered and constrained for better organization */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8 pt-8 lg:pt-4">
            <h1 className="text-3xl font-bold text-foreground">{greetingMessage()}!</h1>
            <p className="text-muted-foreground mt-2">Today is {format(today, 'EEEE, MMMM d, yyyy')}</p>
          </motion.div>

          {/* Live Voice AI Shape - Centered and prominent */}
          <motion.div variants={itemVariants} className="flex justify-center mb-12">
            <div className="text-center">
              <LiveVoiceShape />
              <p className="text-sm text-muted-foreground mt-3 font-medium">Your live AI companion</p>
            </div>
          </motion.div>

          {/* Stats Section - Improved spacing and organization */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Card 1: Tasks Today */}
            <div className="bg-card rounded-2xl shadow-warm p-8 border border-appBorder">
              <div className="flex items-center mb-6">
                <div className="rounded-full bg-primary/10 p-4 mr-4">
                  <Briefcase className={`h-7 w-7 ${iconPrimaryColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">Tasks Today</h3>
                  <p className="text-3xl font-bold text-card-foreground">{totalTasks}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Completion Rate</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div className="bg-card rounded-2xl shadow-warm p-8 border border-appBorder">
              <div className="flex items-center mb-6">
                <div className="rounded-full bg-secondary/10 p-4 mr-4">
                  <CheckCircle className={`h-7 w-7 ${iconSecondaryColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">Completed</h3>
                  <p className="text-3xl font-bold text-card-foreground">{completedToday}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {completedToday === 0
                  ? "No tasks completed yet today"
                  : `You've completed ${completedToday} task${completedToday !== 1 ? 's' : ''} today!`}
              </p>
            </div>

            {/* Card 3: Focus Time */}
            <div className="bg-card rounded-2xl shadow-warm p-8 border border-appBorder">
              <div className="flex items-center mb-6">
                <div className="rounded-full bg-accent/10 p-4 mr-4">
                  <Clock className={`h-7 w-7 ${iconAccentColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-card-foreground">Focus Time</h3>
                  <p className="text-3xl font-bold text-card-foreground">25:00</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/focus')}
                className="w-full mt-4 btn-primary"
              >
                Start Focus Session
              </button>
            </div>
          </motion.div>

          {/* Two-column layout for better organization on larger screens */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Priority Tasks - Takes up 2 columns */}
            <motion.div variants={itemVariants} className="xl:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Priority Tasks</h2>
                <button 
                  onClick={() => navigate('/tasks')}
                  className={`text-primary hover:text-primary-hover flex items-center text-sm font-medium transition-colors duration-200`}
                >
                  <PlusCircle size={16} className="mr-1" />
                  Add Task
                </button>
              </div>

              {state.loading ? (
                <div className="bg-card rounded-2xl p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : state.error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
                  <p className="text-red-600 dark:text-red-400 font-medium">Unable to load tasks</p>
                  <p className="text-red-500 dark:text-red-300 text-sm mt-1">{state.error}</p>
                </div>
              ) : priorityTasks.length > 0 ? (
                <div className="space-y-4">
                  {priorityTasks.map(task => (
                    <TaskCard key={task.id} task={task} onEdit={() => navigate('/tasks')} />
                  ))}
                </div>
              ) : (
                <div className="bg-muted border-appBorder rounded-2xl p-8 text-center">
                  <CheckCircle size={32} className="mx-auto text-muted-foreground mb-3" />
                  {totalTasks === 0 ? (
                    <div>
                      <p className="text-muted-foreground font-medium">No tasks yet!</p>
                      <p className="text-muted-foreground text-sm mt-1">Get started by creating your first task.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground font-medium">No priority tasks right now!</p>
                      <p className="text-muted-foreground text-sm mt-1">You're all caught up with urgent items.</p>
                    </div>
                  )}
                </div>
              )}

              {priorityTasks.length > 0 && (
                <button 
                  onClick={() => navigate('/tasks')}
                  className={`w-full mt-6 text-primary hover:text-primary-hover text-sm font-medium transition-colors duration-200`}
                >
                  View All Tasks →
                </button>
              )}
            </motion.div>

            {/* Learning Resources - Takes up 1 column */}
            <motion.div variants={itemVariants} className="xl:col-span-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Learning Resources</h2>
                <button 
                  onClick={() => navigate('/learning')}
                  className={`text-primary hover:text-primary-hover flex items-center text-sm font-medium transition-colors duration-200`}
                >
                  View All
                </button>
              </div>

              <div className="space-y-6">
                {/* Learning Card 1 */}
                <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full bg-secondary/10 p-2 mr-3">
                      <CheckCircle size={20} className={`${iconSecondaryColor}`} />
                    </div>
                    <h3 className="font-medium text-card-foreground">Understanding ADHD</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn about executive functioning, attention regulation, and practical strategies for everyday life.
                  </p>
                  <button 
                    onClick={() => navigate('/learning')}
                    className={`text-secondary hover:text-secondary-hover text-sm font-medium transition-colors duration-200`}
                  >
                    Explore →
                  </button>
                </div>

                {/* Learning Card 2 */}
                <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
                  <div className="flex items-center mb-3">
                    <div className="rounded-full bg-accent/10 p-2 mr-3">
                      <Book size={20} className={`${iconAccentColor}`} />
                    </div>
                    <h3 className="font-medium text-card-foreground">Reading Strategies</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Effective techniques for improving reading comprehension, focus, and retention.
                  </p>
                  <button 
                    onClick={() => navigate('/learning')}
                    className={`text-accent hover:text-accent-hover text-sm font-medium transition-colors duration-200`}
                  >
                    Explore →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}
      </div>
    </div>
  );
};

export default Dashboard;