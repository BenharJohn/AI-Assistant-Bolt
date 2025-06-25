import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, useTask } from '../context/TaskContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface TaskCardProps {
  task: Task;
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


const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
