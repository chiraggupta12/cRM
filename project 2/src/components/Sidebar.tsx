import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Mail, FileText, KanbanSquare, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Leads', icon: <Users size={20} />, path: '/leads' },
    { label: 'Deals Flow', icon: <KanbanSquare size={20} />, path: '/deals' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <motion.div
      className={cn(
        "h-full bg-white border-r border-gray-200 flex flex-col ease-in-out text-gray-800",
        "hidden lg:flex"
      )}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className={cn("flex items-center", isCollapsed ? "justify-center p-4" : "p-6")}>
        <img src="/logo.png" alt="Indian School of Skills Logo" className={cn("h-10 transition-all duration-300", !isCollapsed && "mr-2")} />
      </div>
      
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path 
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900",
                  isCollapsed && "justify-center px-2"
                )}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
                {/* Indicator only visible when not collapsed */}
                {location.pathname === item.path && !isCollapsed && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute right-0 w-1 h-6 bg-blue-600 rounded-l-md"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Profile Section */}
      <div className={cn("p-4 border-t border-gray-200", isCollapsed && "flex justify-center")}>
        <div className="relative flex items-center gap-2">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn("flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-800", isCollapsed && "justify-center w-full")}
            >
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-800 shrink-0">
                <User size={16} />
              </div>
              {!isCollapsed && (
                 <span className="text-sm font-medium truncate text-gray-800">{user?.email}</span>
              )}
            </button>
            
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "absolute bottom-full left-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 text-gray-800",
                    isCollapsed && "left-1/2 transform -translate-x-1/2 w-40"
                  )}
                >
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium truncate text-gray-800">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-100 hover:text-red-800 rounded-md transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-200 flex justify-center">
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-md hover:bg-gray-200 transition-colors text-gray-800"
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;