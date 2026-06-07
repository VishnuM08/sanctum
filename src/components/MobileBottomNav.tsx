import { Home, Search, Settings, Plus, Files } from 'lucide-react';
import { useStore } from '../store';
import { motion } from 'motion/react';

export function MobileBottomNav() {
  const activeView = useStore((s) => s.activeView);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useStore((s) => s.navigate);
  const navigateToSettings = useStore((s) => s.navigateToSettings);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const createPage = useStore((s) => s.createPage);

  const isPageActive = activeView.type === 'page';
  
  // Helper to determine active tab for the sliding indicator
  const getActiveTabId = () => {
    if (activeView.type === 'home') return 'home';
    if (activeView.type === 'settings') return 'settings';
    if (!sidebarCollapsed || isPageActive) return 'pages';
    return null;
  };

  const activeTabId = getActiveTabId();

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      <motion.button
        type="button"
        className={`mobile-bottom-nav-item ${activeTabId === 'home' ? 'active' : ''}`}
        onClick={() => navigate({ type: 'home' })}
        whileTap={{ scale: 0.9 }}
      >
        {activeTabId === 'home' && (
          <motion.div layoutId="nav-indicator" className="mobile-nav-indicator" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
        )}
        <Home size={22} strokeWidth={activeTabId === 'home' ? 2.5 : 1.75} />
        <span>Home</span>
      </motion.button>

      <motion.button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={() => setSearchOpen(true)}
        whileTap={{ scale: 0.9 }}
      >
        <Search size={22} strokeWidth={1.75} />
        <span>Search</span>
      </motion.button>

      <motion.button
        type="button"
        className="mobile-bottom-nav-item mobile-nav-fab"
        onClick={() => createPage()}
        aria-label="New page"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.05 }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>

      <motion.button
        type="button"
        className={`mobile-bottom-nav-item ${activeTabId === 'pages' ? 'active' : ''}`}
        onClick={toggleSidebar}
        whileTap={{ scale: 0.9 }}
      >
        {activeTabId === 'pages' && (
          <motion.div layoutId="nav-indicator" className="mobile-nav-indicator" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
        )}
        <Files size={22} strokeWidth={activeTabId === 'pages' ? 2.5 : 1.75} />
        <span>Pages</span>
      </motion.button>

      <motion.button
        type="button"
        className={`mobile-bottom-nav-item ${activeTabId === 'settings' ? 'active' : ''}`}
        onClick={() => navigateToSettings()}
        whileTap={{ scale: 0.9 }}
      >
        {activeTabId === 'settings' && (
          <motion.div layoutId="nav-indicator" className="mobile-nav-indicator" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
        )}
        <Settings size={22} strokeWidth={activeTabId === 'settings' ? 2.5 : 1.75} />
        <span>Settings</span>
      </motion.button>
    </nav>
  );
}
