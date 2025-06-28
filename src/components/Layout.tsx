/// layout.tsx
import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Settings, 
  Menu, 
  X,
  BookHeart,
  Bot
} from 'lucide-react';
import LiveVoiceShape from './LiveVoiceShape';

// 🎨 LOGO CONFIGURATION - CHANGE THESE IMPORTS TO TRY DIFFERENT LOGOS
import AevaLogo from '../assets/fox.png';           // Small "A" logo for icon
import AevaTextLogo from '../assets/aeva.png';    // "Aeva" text logo for brand name

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { path: '/focus', label: 'Focus', icon: <Clock size={20} /> },
    { path: '/learning', label: 'Learning', icon: <BookOpen size={20} /> },
    { path: '/journal', label: 'Journal', icon: <BookHeart size={20} /> },
    { path: '/companion', label: 'AI Companion', icon: <Bot size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  // Separate navigation items for mobile bottom bar
  const mobileNavItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { path: '/journal', label: 'Journal', icon: <BookHeart size={20} /> },
    { path: '/companion', label: 'AI', icon: <Bot size={20} /> },
  ];

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Hide floating voice assistant on dashboard (/) since it has its own main one
  const showFloatingVoice = location.pathname !== '/';

  // Dynamic positioning based on page
  const getFloatingPosition = () => {
    switch (location.pathname) {
      case '/focus':
        return 'bottom-6 right-6 lg:bottom-24 lg:right-6';
      case '/journal':
        return 'bottom-32 right-4 lg:bottom-32 lg:right-6';
      case '/learning':
        return 'bottom-24 right-4 lg:bottom-8 lg:right-8';
      case '/tasks':
        return 'bottom-32 right-4 lg:bottom-16 lg:right-6';
      case '/companion':
        return 'bottom-6 right-4 lg:bottom-6 lg:right-6';
      case '/settings':
        return 'bottom-24 right-6 lg:bottom-8 lg:right-8';
      default:
        return 'bottom-24 right-6 lg:bottom-8 lg:right-8';
    }
  };

  // 🎭 ENHANCED FRAMER MOTION VARIANTS FOR ALWAYS-VISIBLE LOGOS
  const logoContainerVariants = {
    collapsed: {
      transition: {
        staggerChildren: 0.1,
        when: "afterChildren"
      }
    },
    expanded: {
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const foxLogoVariants = {
    collapsed: {
      scale: 1,
      rotate: 0,
      x: 0,
      transition: { duration: 0.4, ease: "easeInOut" }
    },
    expanded: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      x: 0,
      transition: { 
        scale: { duration: 0.4, ease: "easeInOut" },
        rotate: { duration: 0.8, ease: "easeInOut" }
      }
    }
  };

  const textLogoVariants = {
    collapsed: {
      opacity: 1,
      x: 0,
      scale: 0.85,  // Slightly smaller when collapsed but still visible
      transition: { duration: 0.4, ease: "easeInOut" }
    },
    expanded: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeInOut", delay: 0.1 }
    }
  };

  const glowVariants = {
    collapsed: {
      opacity: 0.1,
      scale: 0.9,
      transition: { duration: 0.3 }
    },
    expanded: {
      opacity: [0.1, 0.4, 0.1],
      scale: [0.9, 1.3, 0.9],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const navItemVariants = {
    collapsed: {
      x: 0,
      transition: { duration: 0.3 }
    },
    expanded: {
      x: [0, 4, 0],
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b">
        {/* 🎯 MOBILE LOGO - TOUCHING CLOSE WITH FLOATING ANIMATION! */}
        <motion.div 
          className="flex items-center"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* 🦊 MOBILE FOX LOGO - Larger size restored with subtle pulse */}
          <motion.img 
            src={AevaLogo} 
            alt="Aeva Logo" 
            className="w-12 h-12 object-contain"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 1, 0, -1, 0]
            }}
            transition={{ 
              duration: 3.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          {/* 🎨 MOBILE TEXT LOGO - Larger size with shimmer effect */}
          <motion.img 
            src={AevaTextLogo} 
            alt="Aeva" 
            className="h-8 object-contain -ml-1"
            animate={{ 
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 2.8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMenu}
            className="p-2 rounded-xl hover:bg-muted transition-colors duration-200"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden fixed top-16 left-0 right-0 bg-card z-50 border-b"
        >
          <nav className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </motion.div>
      )}

      {/* 🚀 ENHANCED DESKTOP SIDEBAR - WIDER COLLAPSED STATE FOR BOTH LOGOS */}
      <div className="hidden lg:flex">
        <motion.aside 
          className={`fixed h-screen bg-card border-r transition-all duration-400 ease-in-out ${
            isSidebarExpanded ? 'w-64' : 'w-36'  // Increased from w-20 to w-36 (144px) for both logos
          }`}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
          animate={isSidebarExpanded ? "expanded" : "collapsed"}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 relative">
              {/* 🌟 ANIMATED BACKGROUND GLOW */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 blur-xl"
                variants={glowVariants}
                animate={isSidebarExpanded ? "expanded" : "collapsed"}
              />
              
              {/* 🎯 DESKTOP LOGO - BOTH ALWAYS VISIBLE WITH COOL ANIMATIONS */}
              <motion.div 
                className="flex items-center relative z-10 justify-center"
                variants={logoContainerVariants}
                animate={isSidebarExpanded ? "expanded" : "collapsed"}
              >
                {/* 🦊 DESKTOP FOX LOGO - Always visible with rotation on hover */}
                <motion.img 
                  src={AevaLogo} 
                  alt="Aeva Logo" 
                  className="w-12 h-12 object-contain flex-shrink-0"
                  variants={foxLogoVariants}
                  whileHover={{ 
                    scale: 1.3,
                    rotate: 360,
                    transition: { duration: 0.7, type: "spring", stiffness: 300 }
                  }}
                  whileTap={{
                    scale: 0.9,
                    transition: { duration: 0.1 }
                  }}
                />
                
                {/* 🎨 DESKTOP TEXT LOGO - ALWAYS VISIBLE with cool scale animation */}
                <motion.img 
                  src={AevaTextLogo} 
                  alt="Aeva" 
                  className="h-7 object-contain ml-1 flex-shrink-0"  // Slightly smaller in collapsed
                  variants={textLogoVariants}
                  whileHover={{ 
                    scale: 1.15,
                    transition: { duration: 0.3, type: "spring", stiffness: 400 }
                  }}
                />
              </motion.div>
            </div>
            
            <nav className="flex-1 px-3 pb-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  variants={navItemVariants}
                  animate={isSidebarExpanded ? "expanded" : "collapsed"}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center my-1 rounded-xl transition-all duration-300 ${
                      isSidebarExpanded 
                        ? 'justify-start space-x-3 p-3' 
                        : 'justify-center p-2'  // Smaller padding when collapsed
                    } ${
                      location.pathname === item.path
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'hover:bg-muted hover:scale-105'
                    }`}
                  >
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ 
                        scale: 1.3,
                        rotate: [0, -12, 12, 0],
                        transition: { duration: 0.4, type: "spring", stiffness: 300 }
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <AnimatePresence>
                      {isSidebarExpanded && (
                        <motion.span
                          className="whitespace-nowrap font-medium"
                          initial={{ opacity: 0, x: -15, width: 0 }}
                          animate={{ opacity: 1, x: 0, width: "auto" }}
                          exit={{ opacity: 0, x: -15, width: 0 }}
                          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
        </motion.aside>
        
        <main className={`transition-all duration-400 ease-in-out w-full ${
          isSidebarExpanded ? 'ml-64' : 'ml-36'  // Updated to match new collapsed width
        }`}>
          {children}
        </main>
      </div>

      {/* Mobile Content */}
      <main className="lg:hidden pt-16 pb-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-10">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 transition-all duration-200 ${
                location.pathname === item.path
                  ? 'text-primary scale-110'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                {item.icon}
              </motion.div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Conditional Floating Voice Assistant */}
      {showFloatingVoice && (
        <div className={`fixed ${getFloatingPosition()} z-40`}>
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <LiveVoiceShape className="mb-2" />
            <motion.p 
              className="text-xs text-muted-foreground text-center bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg border border-appBorder/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              AI Assistant
            </motion.p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Layout;