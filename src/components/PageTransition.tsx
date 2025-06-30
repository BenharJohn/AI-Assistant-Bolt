import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Define page hierarchy for smart transition directions
const pageHierarchy = {
  '/': 0,
  '/tasks': 1,
  '/focus': 1,
  '/learning': 1,
  '/journal': 1,
  '/companion': 1,
  '/settings': 2
};

// Different transition variants based on navigation type
const transitionVariants = {
  // Slide transitions for hierarchical navigation
  slideRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideLeft: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  // Fade transition for same-level navigation
  fade: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  // Scale transition for modal-like pages
  scale: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.05, y: -20 }
  },
  // Depth transition for going deeper into content
  depth: {
    initial: { opacity: 0, scale: 1.1, z: -100 },
    animate: { opacity: 1, scale: 1, z: 0 },
    exit: { opacity: 0, scale: 0.9, z: 100 }
  }
};

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const { reducedMotion } = useSettings();
  const [previousPath, setPreviousPath] = React.useState<string>('');

  // Determine transition type based on navigation
  const getTransitionVariant = () => {
    if (reducedMotion) {
      return 'fade'; // Simple fade for reduced motion
    }

    const currentLevel = pageHierarchy[location.pathname as keyof typeof pageHierarchy] ?? 1;
    const previousLevel = pageHierarchy[previousPath as keyof typeof pageHierarchy] ?? 1;

    // Special transitions for specific pages
    if (location.pathname === '/settings') {
      return 'scale'; // Settings feels more modal-like
    }

    if (location.pathname === '/focus') {
      return 'depth'; // Focus mode feels like diving deeper
    }

    // Hierarchical navigation
    if (currentLevel > previousLevel) {
      return 'slideRight'; // Going deeper
    } else if (currentLevel < previousLevel) {
      return 'slideLeft'; // Going back
    }

    // Same level navigation
    return 'fade';
  };

  // Update previous path when location changes
  React.useEffect(() => {
    return () => {
      setPreviousPath(location.pathname);
    };
  }, [location.pathname]);

  const variant = getTransitionVariant();
  const transitions = transitionVariants[variant as keyof typeof transitionVariants];

  const transitionConfig = {
    duration: reducedMotion ? 0.1 : 0.4,
    ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for premium feel
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={transitions.initial}
        animate={transitions.animate}
        exit={transitions.exit}
        transition={transitionConfig}
        className="w-full h-full"
        style={{ 
          // Ensure proper stacking during transitions
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Page content wrapper with subtle background transition */}
        <motion.div
          initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
          exit={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
          transition={{ duration: transitionConfig.duration }}
          className="w-full min-h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;