import React from 'react';

interface BoltBadgeProps {
  variant?: 'black' | 'white' | 'text';
  className?: string;
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ variant = 'black', className = '' }) => {
  const handleClick = () => {
    window.open('https://bolt.new/', '_blank', 'noopener,noreferrer');
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 ${className}`}
        aria-label="Built with Bolt.new"
      >
        Built with Bolt
      </button>
    );
  }

  // SVG for black circle badge (for light backgrounds)
  const BlackCircleBadge = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle cx="20" cy="20" r="20" fill="#000000"/>
      <path
        d="M12 14.5c0-1.38 1.12-2.5 2.5-2.5h11c1.38 0 2.5 1.12 2.5 2.5v11c0 1.38-1.12 2.5-2.5 2.5h-11c-1.38 0-2.5-1.12-2.5-2.5v-11z"
        fill="#FFFFFF"
      />
      <path
        d="M16.5 18l3 3 7-7"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // SVG for white circle badge (for dark backgrounds)
  const WhiteCircleBadge = () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle cx="20" cy="20" r="20" fill="#FFFFFF"/>
      <path
        d="M12 14.5c0-1.38 1.12-2.5 2.5-2.5h11c1.38 0 2.5 1.12 2.5 2.5v11c0 1.38-1.12 2.5-2.5 2.5h-11c-1.38 0-2.5-1.12-2.5-2.5v-11z"
        fill="#000000"
      />
      <path
        d="M16.5 18l3 3 7-7"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <button
      onClick={handleClick}
      className={`group relative w-10 h-10 hover:scale-110 transition-transform duration-200 ${className}`}
      aria-label="Built with Bolt.new"
      title="Built with Bolt.new"
    >
      {variant === 'white' ? <WhiteCircleBadge /> : <BlackCircleBadge />}
      
      {/* Hover tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Built with Bolt.new
      </div>
    </button>
  );
};

export default BoltBadge;