import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { Task } from '../context/TaskContext'; // Import your updated Task type

interface TaskCardProps {
  task: Task;
  // You might pass update/delete functions from context here if needed
}

// A smaller component for rendering subtasks cleanly
const SubtaskItem: React.FC<{ subtask: Task }> = ({ subtask }) => {
    return (
        <div className="flex items-center space-x-3 pl-4 py-2 border-t border-appBorder/50">
            {subtask.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-secondary" />
            ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            <p className={`text-sm ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {subtask.title}
            </p>
        </div>
    );
};


const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  
  const getPriorityClasses = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-primary bg-primary/5'; // Use tints of your theme colors
      case 'medium': return 'border-secondary bg-secondary/5';
      case 'low': return 'border-muted-foreground/50 bg-muted/20';
      default: return 'border-appBorder bg-card';
    }
  };

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200 shadow-soft hover:shadow-warm ${getPriorityClasses(task.priority)}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <button className="mt-1 transition-colors duration-200 hover:scale-110">
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
              
              <div className="flex items-center space-x-4 mt-2">
                {task.priority && (
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {task.priority} Priority
                  </span>
                )}
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- NEW: Render subtasks if they exist --- */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="border-t-2 border-appBorder bg-background/50">
            <div className="p-2 space-y-1">
                {task.subtasks.map(subtask => (
                    <SubtaskItem key={subtask.id} subtask={subtask} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
