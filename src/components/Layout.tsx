/// layout.tsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
        <div className="flex items-center space-x-3">
          {/* 🦊 MOBILE FOX LOGO - Clean, no background! */}
          {/* 📏 MOBILE FOX LOGO SIZE: w-16 h-16 (clean and prominent) */}
          <img 
            src={AevaLogo} 
            alt="Aeva Logo" 
            className="w-16 h-16 object-contain"
          />
          {/* 🎨 MOBILE TEXT LOGO - Balanced size */}
          {/* 📏 MOBILE TEXT LOGO SIZE: h-10 */}
          <img 
            src={AevaTextLogo} 
            alt="Aeva" 
            className="h-10 object-contain"
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
        <aside className="fixed h-screen w-64 bg-card border-r">
          <div className="flex flex-col h-full">
            <div className="p-6">
              <div className="flex items-center space-x-4">
                {/* 🦊 DESKTOP FOX LOGO - Clean, no background! */}
                {/* 📏 DESKTOP FOX LOGO SIZE: w-20 h-20 (prominent and beautiful) */}
                <img 
                  src={AevaLogo} 
                  alt="Aeva Logo" 
                  className="w-20 h-20 object-contain"
                />
                {/* 🎨 DESKTOP TEXT LOGO - Balanced size */}
                {/* 📏 DESKTOP TEXT LOGO SIZE: h-12 */}
                <img 
                  src={AevaTextLogo} 
                  alt="Aeva" 
                  className="h-12 object-contain"
                />
              </div>
            </div>
            
            <nav className="flex-1 px-4 pb-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 my-1 rounded-xl transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary border-l-4 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        
        <main className="ml-64 w-full">
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