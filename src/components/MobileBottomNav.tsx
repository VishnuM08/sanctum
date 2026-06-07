import { Home, Search, Settings, Plus, Files } from 'lucide-react';
import { useStore } from '../store';

export function MobileBottomNav() {
  const activeView = useStore((s) => s.activeView);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useStore((s) => s.navigate);
  const navigateToSettings = useStore((s) => s.navigateToSettings);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const createPage = useStore((s) => s.createPage);

  const isPageActive = activeView.type === 'page';

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      <button
        type="button"
        className={`mobile-bottom-nav-item ${activeView.type === 'home' ? 'active' : ''}`}
        onClick={() => navigate({ type: 'home' })}
      >
        <Home size={22} strokeWidth={activeView.type === 'home' ? 2.5 : 1.75} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={() => setSearchOpen(true)}
      >
        <Search size={22} strokeWidth={1.75} />
        <span>Search</span>
      </button>

      <button
        type="button"
        className="mobile-bottom-nav-item mobile-nav-fab"
        onClick={() => createPage()}
        aria-label="New page"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${(!sidebarCollapsed || isPageActive) ? 'active' : ''}`}
        onClick={toggleSidebar}
      >
        <Files size={22} strokeWidth={!sidebarCollapsed ? 2.5 : 1.75} />
        <span>Pages</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${activeView.type === 'settings' ? 'active' : ''}`}
        onClick={() => navigateToSettings()}
      >
        <Settings size={22} strokeWidth={activeView.type === 'settings' ? 2.5 : 1.75} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
