import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Image, 
  Play, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Bell,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage = 'dashboard' }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
    { icon: Image, label: 'Library', path: '/library', id: 'library' },
    { icon: Play, label: 'Slideshows', path: '/slideshows', id: 'slideshows' },
    { icon: Settings, label: 'Settings', path: '/settings', id: 'settings' },
  ];

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 64 }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0, width: 'auto' },
    collapsed: { opacity: 0, x: -20, width: 0 }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-950' 
        : 'bg-gray-50'
    }`}>
      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-full z-50 overflow-hidden ${
          theme === 'dark' 
            ? 'backdrop-blur-md bg-black/10 border-r border-white/10' 
            : 'backdrop-blur-md bg-white/10 border-r border-black/10'
        }`}
        variants={sidebarVariants}
        animate={sidebarExpanded ? 'expanded' : 'collapsed'}
        onMouseEnter={() => !isMobile && setSidebarExpanded(true)}
        onMouseLeave={() => !isMobile && setSidebarExpanded(false)}
      >
        <div className="p-4 w-full">
          {/* Logo */}
          <div className={`flex items-center mb-8 ${
            sidebarExpanded ? 'justify-start' : 'justify-center'
          }`}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <motion.span
              className={`ml-3 font-bold text-lg overflow-hidden whitespace-nowrap ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
              variants={itemVariants}
              animate={sidebarExpanded ? 'expanded' : 'collapsed'}
            >
              Framatic
            </motion.span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center rounded-lg transition-all duration-200 backdrop-blur-md ${
                    sidebarExpanded 
                      ? 'justify-start p-3 w-full' 
                      : 'justify-center p-2 w-10 h-10 mx-auto'
                  } ${
                    currentPage === item.id
                      ? 'bg-green-600 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-white/10 hover:shadow-md'
                      : 'text-gray-700 hover:bg-black/10 hover:shadow-md'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    className="ml-3 overflow-hidden whitespace-nowrap"
                    variants={itemVariants}
                    animate={sidebarExpanded ? 'expanded' : 'collapsed'}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

      </motion.div>

      {/* Glass Overlay - only covers menu expansion area */}
      <motion.div
        className={`fixed left-16 top-0 h-full z-40 backdrop-blur-md ${
          theme === 'dark' ? 'bg-black/10' : 'bg-white/10'
        }`}
        initial={{ width: 0, opacity: 0 }}
        animate={{ 
          width: sidebarExpanded ? 176 : 0, // 240 - 64 = 176px expansion area
          opacity: sidebarExpanded ? 1 : 0 
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ pointerEvents: 'none' }}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidebarExpanded ? 'ml-60' : 'ml-16'
      }`}>
        {/* Top Bar */}
        <div className={`h-16 ${
          theme === 'dark' 
            ? 'backdrop-blur-md bg-black/10 border-b border-white/10' 
            : 'backdrop-blur-md bg-white/10 border-b border-black/10'
        } flex items-center justify-between px-6`}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="lg:hidden"
            >
              {sidebarExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {/* Quick Actions */}
          <div className="flex items-center space-x-4">
            <motion.button
              className="relative overflow-hidden bg-orange-500 px-4 py-2 rounded-lg text-white font-medium hover:bg-orange-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-4 h-4 mr-2 inline" />
              AI Create
            </motion.button>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Changelog */}
            <motion.button
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;