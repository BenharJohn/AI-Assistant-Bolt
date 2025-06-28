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
        // On focus page, position lower right to avoid focus controls
        return 'bottom-6 right-6 lg:bottom-24 lg:right-6';
      case '/journal':
        // On journal page, position middle right to avoid text input
        return 'bottom-32 right-4 lg:bottom-32 lg:right-6';
      case '/learning':
        // On learning page, position to avoid content
        return 'bottom-24 right-4 lg:bottom-8 lg:right-8';
      case '/tasks':
        // On tasks page, avoid task cards and add button
        return 'bottom-32 right-4 lg:bottom-16 lg:right-6';
      case '/companion':
        // On companion page, position lower to avoid chat interface
        return 'bottom-6 right-4 lg:bottom-6 lg:right-6';
      case '/settings':
        // On settings page, standard position
        return 'bottom-24 right-6 lg:bottom-8 lg:right-8';
      default:
        return 'bottom-24 right-6 lg:bottom-8 lg:right-8';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b">
        {/* 🎯 MOBILE LOGO - TOUCHING CLOSE! */}
        <div className="flex items-center">
          {/* 🦊 MOBILE FOX LOGO - Direct image, no wrapper div */}
          <img 
            src={AevaLogo} 
            alt="Aeva Logo" 
            className="w-16 h-16 object-contain"
          />
          {/* 🎨 MOBILE TEXT LOGO - Negative margin to bring it closer */}
          <img 
            src={AevaTextLogo} 
            alt="Aeva" 
            className="h-10 object-contain -ml-2"
          />
        </div>
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <aside 
          className={`fixed h-screen bg-card border-r transition-all duration-300 ease-in-out ${
            isSidebarExpanded ? 'w-64' : 'w-20'
          }`}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full">
            <div className="p-6">
              {/* 🎯 DESKTOP LOGO - COLLAPSIBLE */}
              <div className="flex items-center overflow-hidden">
                {/* 🦊 DESKTOP FOX LOGO - Always visible */}
                <img 
                  src={AevaLogo} 
                  alt="Aeva Logo" 
                  className={`object-contain transition-all duration-300 ${
                    isSidebarExpanded ? 'w-12 h-12' : 'w-8 h-8'
                  }`}
                />
                {/* 🎨 DESKTOP TEXT LOGO - Shows/hides on hover */}
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.img 
                      src={AevaTextLogo} 
                      alt="Aeva" 
                      className="h-8 object-contain ml-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <nav className="flex-1 px-4 pb-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center my-1 rounded-xl transition-all duration-300 ${
                    isSidebarExpanded ? 'justify-start space-x-3 p-3' : 'justify-center p-3'
                  } ${
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary border-l-4 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <AnimatePresence>
                    {isSidebarExpanded && (
                      <motion.span
                        className="whitespace-nowrap"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        
        <main className={`transition-all duration-300 ease-in-out w-full ${
          isSidebarExpanded ? 'ml-64' : 'ml-20'
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
              className={`flex flex-col items-center justify-center p-2 ${
                location.pathname === item.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {item.icon}
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