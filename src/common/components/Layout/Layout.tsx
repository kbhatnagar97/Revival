import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import GalaxyToggleButton from '../GalaxyToggleButton/GalaxyToggleButton';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Layout.scss';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useLayoutEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

const Layout: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isSidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [headerTitle, setHeaderTitle] = useState('Welcome');
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const getTitleFromPath = (path: string): string => {
      // FIX: Check if the path starts with '/habit-tracker'
      if (path.startsWith('/habit-tracker')) {
        return 'Habit Tracker';
      }
      // Keep the logic for other pages
      switch (path) {
        case '/gaussian-visualizer': return 'Gaussian Visualizer';
        default: return 'Project Portfolio';
      }
    };
    setHeaderTitle(getTitleFromPath(location.pathname));
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  const contentWrapperStyle: React.CSSProperties = {
    marginLeft: isDesktop && isSidebarOpen ? '280px' : '0',
  };

  return (
    <div className="layout">
      {isSidebarOpen && <Sidebar onClose={closeSidebar} />}

      <div className="layout__content-wrapper" style={contentWrapperStyle}>
        <header className="layout__header">
          <h1 className="layout__header-title">{headerTitle}</h1>
          <div className="layout__header-actions">
            {isDesktop ? (
              <GalaxyToggleButton onClick={toggleSidebar} isOpen={isSidebarOpen} />
            ) : (
              <button className="layout__sidebar-toggle" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
            )}
          </div>
        </header>

        <main className="layout__main-content">
          <Outlet context={{ isSidebarOpen }} />
        </main>
      </div>

      {isSidebarOpen && !isDesktop && (
        <div className="layout__overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default Layout;