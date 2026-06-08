import { Home, Bot, CalendarDays, Plus, Files } from 'lucide-react';
import { useStore } from '../store';
import { motion } from 'motion/react';

export function MobileBottomNav() {
  const activeView = useStore((s) => s.activeView);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useStore((s) => s.navigate);
  const createPage = useStore((s) => s.createPage);

  const isPageActive = activeView.type === 'page';
  
  // Helper to determine active tab for the sliding indicator
  const getActiveTabId = () => {
    if (activeView.type === 'home') return 'home';
    if (activeView.type === 'agent') return 'agent';
    if (activeView.type === 'calendar') return 'calendar';
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
        className={`mobile-bottom-nav-item ${activeTabId === 'agent' ? 'active' : ''}`}
        onClick={() => navigate({ type: 'agent' })}
        whileTap={{ scale: 0.9 }}
      >
        {activeTabId === 'agent' && (
          <motion.div layoutId="nav-indicator" className="mobile-nav-indicator" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
        )}
        <Bot size={22} strokeWidth={activeTabId === 'agent' ? 2.5 : 1.75} />
        <span>Agent</span>
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
        className={`mobile-bottom-nav-item ${activeTabId === 'calendar' ? 'active' : ''}`}
        onClick={() => navigate({ type: 'calendar' })}
        whileTap={{ scale: 0.9 }}
      >
        {activeTabId === 'calendar' && (
          <motion.div layoutId="nav-indicator" className="mobile-nav-indicator" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
        )}
        <CalendarDays size={22} strokeWidth={activeTabId === 'calendar' ? 2.5 : 1.75} />
        <span>Calendar</span>
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
    </nav>
  );
}
