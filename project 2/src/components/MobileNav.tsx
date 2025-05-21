import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, KanbanSquare, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Leads', icon: <Users size={20} />, path: '/leads' },
    { label: 'Deals', icon: <KanbanSquare size={20} />, path: '/deals' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              location.pathname === item.path 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="relative p-2">
              {item.icon}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </div>
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
        <Link
          to="/leads/new"
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 hover:text-gray-700"
        >
          <div className="relative p-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full -mt-5">
              <Plus size={20} />
            </div>
          </div>
          <span className="text-xs mt-0.5">New Lead</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;
