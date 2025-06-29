import React from 'react';
// --- 1. Import the image file directly ---
import boltLogoBlack from '../assets/black_circle_360x360.png';

interface BoltBadgeProps {
  variant?: 'black' | 'white' | 'text';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  variant = 'black', 
  className = '',
  size = 'md' 
}) => {
  const handleClick = () => {
    window.open('https://bolt.new/', '_blank', 'noopener,noreferrer');
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-200 ${className}`}
        aria-label="Built with Bolt.new"
      >
        Built with Bolt
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group relative ${sizeClasses[size]} hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-full z-30 ${className}`}
      aria-label="Built with Bolt.new"
      title="Built with Bolt.new"
    >
      {/* --- 2. Use the imported variable in the src attribute --- */}
      {variant === 'black' ? (
        <img 
          src={boltLogoBlack} 
          alt="Built with Bolt.new" 
          className="w-full h-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-lg">
          <img 
            src={boltLogoBlack}
            alt="Built with Bolt.new" 
            className="w-full h-full object-contain"
            loading="lazy"
            style={{ filter: 'invert(1)' }}
          />
        </div>
      )}
      
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
        Built with Bolt.new
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
      </div>
    </button>
  );
};

export default BoltBadge;