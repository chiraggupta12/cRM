import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile nav when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleSidebar} />
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobile && mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween' }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl lg:hidden overflow-y-auto"
            >
              <Sidebar isCollapsed={false} toggleCollapse={toggleSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={cn(
        "flex flex-col flex-grow overflow-hidden bg-white rounded-tl-lg shadow-sm relative",
        "transition-all duration-300 ease-in-out w-full",
        isMobile ? 'rounded-none' : 'lg:rounded-tl-lg'
      )}>
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button 
            onClick={toggleMobileNav}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {location.pathname === '/' ? 'Dashboard' : 
             location.pathname.startsWith('/leads') ? 'Leads' : 
             location.pathname.startsWith('/deals') ? 'Deals' : ''}
          </h1>
          <div className="w-10"></div> {/* For balance */}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <div className="mx-auto max-w-7xl w-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
};

export default Layout;