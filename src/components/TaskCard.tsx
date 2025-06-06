import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
}

interface TaskCardProps {
  task: Task;
  onToggle?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Circle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getPriorityColor(task.priority)} ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onToggle?.(task.id)}
            className="mt-1 transition-colors duration-200 hover:scale-110"
          >
            {task.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          
          <div className="flex-1">
            <h3 className={`font-semibold text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-2">
              {task.priority && (
                <div className="flex items-center space-x-1">
                  {getPriorityIcon(task.priority)}
                  <span className="text-xs font-medium capitalize text-gray-600">
                    {task.priority}
                  </span>
                </div>
              )}
              
              {task.category && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {task.category}
                </span>
              )}
              
              {task.dueDate && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(task.id)}
              className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;