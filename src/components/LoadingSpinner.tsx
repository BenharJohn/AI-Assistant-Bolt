import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const { reducedMotion } = useSettings();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent'
  };

  if (reducedMotion) {
    return (
      <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
        <div className="w-full h-full border-2 border-current border-t-transparent rounded-full opacity-75" />
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div className="w-full h-full border-2 border-current border-t-transparent rounded-full" />
    </motion.div>
  );
};

export default LoadingSpinner;