import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Search, Bell, User, Menu as MenuIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarOpen }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-border z-10 py-4 px-4 md:px-6 sticky top-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
          
          <div className="relative max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              className="input !pl-10 md:w-64 lg:w-80"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Bell size={20} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
                <User size={16} />
              </div>
            </button>
            
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-border z-50"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive hover:text-white rounded-md transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;