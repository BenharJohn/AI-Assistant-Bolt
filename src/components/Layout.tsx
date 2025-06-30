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
import foxIcon from '../assets/fox.png';
import aevaLogo from '../assets/aeva.png';
import { useSettings } from '../context/SettingsContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const { reducedMotion } = useSettings();

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b relative z-50">
        <motion.div 
          className="flex items-center -space-x-3"
          whileHover={!reducedMotion ? { scale: 1.02 } : {}}
          transition={{ duration: 0.2 }}
        >
          <div className="w-14 h-14 flex items-center justify-center">
            <img src={foxIcon} alt="Aeva Fox" className="w-13 h-13 object-contain" />
          </div>
          <div className="h-9 flex items-center">
            <img src={aevaLogo} alt="Aeva" className="h-8 object-contain" />
          </div>
        </motion.div>
        <div className="flex items-center space-x-2">
          <motion.button 
            onClick={toggleMenu}
            className="p-2 rounded-xl hover:bg-muted transition-colors duration-200"
            whileTap={!reducedMotion ? { scale: 0.95 } : {}}
          >
            <motion.div
              animate={{ rotate: menuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </motion.button>
        </div>
      </header>

      {/* Mobile Menu with enhanced animations */}
      <motion.div
        initial={false}
        animate={{ 
          height: menuOpen ? 'auto' : 0,
          opacity: menuOpen ? 1 : 0
        }}
        transition={{ 
          duration: reducedMotion ? 0.1 : 0.3,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="lg:hidden fixed top-16 left-0 right-0 bg-card z-40 border-b overflow-hidden"
      >
        <nav className="flex flex-col p-4">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={false}
              animate={{ 
                x: menuOpen ? 0 : -20,
                opacity: menuOpen ? 1 : 0
              }}
              transition={{ 
                duration: reducedMotion ? 0.1 : 0.2,
                delay: reducedMotion ? 0 : index * 0.05
              }}
            >
              <Link
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <motion.div
                  whileHover={!reducedMotion ? { scale: 1.1 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {item.icon}
                </motion.div>
                <span>{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </nav>
      </motion.div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <aside className="fixed h-screen w-64 bg-card border-r">
          <div className="flex flex-col h-full">
            <motion.div 
              className="p-6"
              whileHover={!reducedMotion ? { scale: 1.02 } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center -space-x-5">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img src={foxIcon} alt="Aeva Fox" className="w-18 h-18 object-contain" />
                </div>
                <div className="h-14 flex items-center">
                  <img src={aevaLogo} alt="Aeva" className="h-12 object-contain" />
                </div>
              </div>
            </motion.div>
            
            <nav className="flex-1 px-4 pb-4">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={!reducedMotion ? { x: 4 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 my-1 rounded-xl transition-all duration-300 ${
                      location.pathname === item.path
                        ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-lg'
                        : 'hover:bg-muted hover:shadow-md'
                    }`}
                  >
                    <motion.div
                      animate={{ 
                        scale: location.pathname === item.path ? 1.1 : 1,
                        rotate: location.pathname === item.path ? 360 : 0
                      }}
                      transition={{ 
                        duration: 0.5,
                        type: "spring",
                        damping: 15
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <span className="font-medium">{item.label}</span>
                    
                    {/* Active indicator */}
                    {location.pathname === item.path && (
                      <motion.div
                        className="ml-auto w-2 h-2 bg-primary rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 500,
                          damping: 15
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
        </aside>
        
        <main className="ml-64 w-full min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Content */}
      <main className="lg:hidden pt-0 pb-20 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation with enhanced animations */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNavItems.map((item) => (
            <motion.div
              key={item.path}
              whileTap={!reducedMotion ? { scale: 0.9 } : {}}
              className="flex-1"
            >
              <Link
                to={item.path}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <motion.div
                  animate={{ 
                    scale: location.pathname === item.path ? 1.2 : 1,
                    y: location.pathname === item.path ? -2 : 0
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  {item.icon}
                </motion.div>
                <motion.span 
                  className="text-xs mt-1 font-medium"
                  animate={{ 
                    fontWeight: location.pathname === item.path ? 600 : 500
                  }}
                >
                  {item.label}
                </motion.span>
                
                {/* Active indicator for mobile */}
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 500,
                      damping: 15
                    }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;