import React from 'react';

interface BoltBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  className = '',
  size = 'md' 
}) => {
  const handleClick = () => {
    window.open('https://bolt.new/', '_blank', 'noopener,noreferrer');
  };

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative ${sizeClasses[size]} hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-full ${className}`}
      aria-label="Built with Bolt.new"
      title="Built with Bolt.new"
    >
      <img 
        src="/black_circle_360x360.png" 
        alt="Built with Bolt.new" 
        className="w-full h-full object-contain"
        loading="lazy"
      />
      
      {/* Enhanced hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
        Built with Bolt.new
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
      </div>
    </button>
  );
};

export default BoltBadge;