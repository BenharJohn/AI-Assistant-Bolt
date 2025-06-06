import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Book, CalendarClock, Brain, PlusCircle, CheckCircle, Clock } from 'lucide-react'; // Added CheckCircle and Clock for icons
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard'; // Assuming TaskCard is in ui subfolder
import AIAssistant from '../components/AIAssistant'; // Assuming AIAssistant is in ui subfolder
import AICompanionButton from '../components/AICompanionButton'; // Assuming AICompanionButton is in ui subfolder
import { useSettings } from '../context/SettingsContext';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { state } = useTask();
  const { reducedMotion } = useSettings();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const today = new Date();

  const priorityTasks = state.tasks
    .filter(task =>
      task.status !== 'completed' &&
      (task.priority === 'high' ||
       (task.dueDate && new Date(task.dueDate) <= new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)))
    )
    .slice(0, 3);

  const completedToday = state.tasks.filter(task =>
    task.status === 'completed' &&
    new Date(task.updatedAt).toDateString() === today.toDateString()
  ).length;

  const totalTasks = state.tasks.filter(task => task.status !== 'completed').length;
  const completionRate = state.tasks.length > 0
    ? Math.round((completedToday / Math.max(completedToday + totalTasks, 1)) * 100)
    : 0;

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

  // Define icon colors based on the theme for better consistency
  const iconPrimaryColor = "text-primary"; // Uses Muted Terracotta from your theme
  const iconSecondaryColor = "text-secondary"; // Uses Gentle Apricot from your theme
  const iconAccentColor = "text-accent"; // Uses Gentle Apricot (or distinct accent if defined) from your theme


  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl text-foreground"> {/* Default text for the page */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          {/* Greeting text uses foreground color by default now, which should be dark enough. */}
          {/* Explicitly setting it for clarity. */}
          <h1 className="text-3xl font-bold text-foreground">{greetingMessage()}!</h1>
          <p className="text-muted-foreground mt-2">Today is {format(today, 'EEEE, MMMM d, yyyy')}</p>
        </motion.div>

        {/* AI Companion Button */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          {/* AICompanionButton should internally use themed styles */}
          <AICompanionButton onActivate={() => setShowAIAssistant(true)} />
        </motion.div>

        {/* Stats Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> {/* Increased gap slightly */}
          {/* Card 1: Tasks Today */}
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-primary/10 p-3 mr-4"> {/* Light tint of primary */}
                <Briefcase className={`h-6 w-6 ${iconPrimaryColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-card-foreground">Tasks Today</h3>
                <p className="text-2xl font-bold text-card-foreground">{totalTasks}</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Completion Rate</span>
                <span>{completionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5"> {/* Slightly thicker bar */}
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-secondary/10 p-3 mr-4"> {/* Light tint of secondary */}
                <CheckCircle className={`h-6 w-6 ${iconSecondaryColor}`} /> {/* Changed icon */}
              </div>
              <div>
                <h3 className="text-lg font-medium text-card-foreground">Completed</h3>
                <p className="text-2xl font-bold text-card-foreground">{completedToday}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {completedToday === 0
                ? "No tasks completed yet today"
                : `You've completed ${completedToday} task${completedToday !== 1 ? 's' : ''} today!`}
            </p>
          </div>

          {/* Card 3: Focus Time */}
          <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-accent/10 p-3 mr-4"> {/* Light tint of accent */}
                <Clock className={`h-6 w-6 ${iconAccentColor}`} /> {/* Changed icon */}
              </div>
              <div>
                <h3 className="text-lg font-medium text-card-foreground">Focus Time</h3>
                <p className="text-2xl font-bold text-card-foreground">25:00</p>
              </div>
            </div>
            {/* Use one of the button styles from index.css or Tailwind theme */}
            <button className="w-full mt-2 btn-primary"> {/* Applied .btn-primary */}
              Start Focus Session
            </button>
          </div>
        </motion.div>

        {/* Priority Tasks */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Priority Tasks</h2>
            <button className={`text-primary hover:text-primary-hover flex items-center text-sm font-medium`}>
              <PlusCircle size={16} className="mr-1" />
              Add Task
            </button>
          </div>

          {priorityTasks.length > 0 ? (
            <div className="space-y-4"> {/* Added space between task cards */}
              {priorityTasks.map(task => (
                // TaskCard should internally use themed styles (bg-card, text-card-foreground etc.)
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="bg-muted border-appBorder rounded-2xl p-6 text-center">
              <Brain size={32} className="mx-auto text-muted-foreground mb-3" /> {/* Added an icon */}
              <p className="text-muted-foreground">No priority tasks right now. Great job!</p>
            </div>
          )}

          {priorityTasks.length > 0 && (
            <button className={`w-full mt-4 text-primary hover:text-primary-hover text-sm font-medium`}>
              View All Tasks →
            </button>
          )}
        </motion.div>

        {/* Learning Resources */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Learning Resources</h2>
            <button className={`text-primary hover:text-primary-hover flex items-center text-sm font-medium`}>
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Increased gap */}
            {/* Learning Card 1 */}
            <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
              <div className="flex items-center mb-3">
                <div className="rounded-full bg-secondary/10 p-2 mr-3"> {/* Light tint of secondary */}
                  <Brain size={20} className={`${iconSecondaryColor}`} />
                </div>
                <h3 className="font-medium text-card-foreground">Understanding ADHD</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Learn about executive functioning, attention regulation, and practical strategies for everyday life.
              </p>
              <button className={`text-secondary hover:text-secondary-hover text-sm font-medium`}>
                Explore →
              </button>
            </div>

            {/* Learning Card 2 */}
            <div className="bg-card rounded-2xl shadow-warm p-6 border border-appBorder">
              <div className="flex items-center mb-3">
                <div className="rounded-full bg-accent/10 p-2 mr-3"> {/* Light tint of accent */}
                  <Book size={20} className={`${iconAccentColor}`} />
                </div>
                <h3 className="font-medium text-card-foreground">Reading Strategies</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Effective techniques for improving reading comprehension, focus, and retention.
              </p>
              <button className={`text-accent hover:text-accent-hover text-sm font-medium`}> {/* Assuming accent-hover is defined or use secondary-hover */}
                Explore →
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />} {/* Assuming AIAssistant has an onClose prop */}
    </div>
  );
};

export default Dashboard;
