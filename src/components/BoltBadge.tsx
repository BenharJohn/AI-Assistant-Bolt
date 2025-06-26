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
      <g transform="translate(12, 12)">
        <path
          d="M9 2L7 8h5l-2 6 6-8h-5l2-6z"
          fill="#FFFFFF"
          strokeLinejoin="round"
        />
      </g>
      {/* "bolt" text */}
      <text
        x="20"
        y="32"
        textAnchor="middle"
        className="text-[6px] font-bold"
        fill="#FFFFFF"
      >
        bolt
      </text>
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
      <g transform="translate(12, 12)">
        <path
          d="M9 2L7 8h5l-2 6 6-8h-5l2-6z"
          fill="#000000"
          strokeLinejoin="round"
        />
      </g>
      {/* "bolt" text */}
      <text
        x="20"
        y="32"
        textAnchor="middle"
        className="text-[6px] font-bold"
        fill="#000000"
      >
        bolt
      </text>
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
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
        Built with Bolt.new
      </div>
    </button>
  );
};

export default BoltBadge;