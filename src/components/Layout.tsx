import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Brain,
  BookHeart,
  Bot
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useSettings();

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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-background text-foreground`}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">FocusAssist</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-muted transition-colors duration-200"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-xl font-semibold">FocusAssist</h1>
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
            
            <div className="p-4 border-t">
              <button
                onClick={toggleDarkMode}
                className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-muted transition-colors duration-200"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
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
    </div>
  );
};

export default Layout;