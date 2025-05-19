import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  // Removed toggleSidebar and sidebarOpen props
}

const Header: React.FC<HeaderProps> = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-border z-10 py-4 px-4 md:px-6 sticky top-0">
      <div className="flex items-center justify-between">
        <div className="flex-grow">{/* Optional: add a title or other content here */}</div>
        
        <div className="flex items-center gap-3">
          {/* Removed the profile section div entirely */}
        </div>
      </div>
    </header>
  );
};

export default Header;