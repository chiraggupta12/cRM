import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Mail, FileText, KanbanSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { label: 'Leads', icon: <Users size={20} />, path: '/leads' },
    { label: 'Deals Flow', icon: <KanbanSquare size={20} />, path: '/deals' },
    { label: 'Contacts', icon: <Mail size={20} />, path: '/contacts' },
    { label: 'Forms', icon: <FileText size={20} />, path: '/forms' },
  ];

  return (
    <div className="h-full bg-card w-[280px] border-r border-border flex flex-col">
      <div className="p-6 flex items-center">
        <Users className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-xl font-semibold">LeadFlow CRM</h1>
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
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute right-0 w-1 h-6 bg-white rounded-l-md"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;