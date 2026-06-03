import { Home, Search, Settings, Plus } from 'lucide-react';
import { useStore } from '../store';

export function MobileBottomNav() {
  const activeView = useStore((s) => s.activeView);
  const navigate = useStore((s) => s.navigate);
  const navigateToSettings = useStore((s) => s.navigateToSettings);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const createPage = useStore((s) => s.createPage);

  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-bottom-nav-item ${activeView.type === 'home' ? 'active' : ''}`}
        onClick={() => navigate({ type: 'home' })}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        className="mobile-bottom-nav-item"
        onClick={() => setSearchOpen(true)}
      >
        <Search size={20} />
        <span>Search</span>
      </button>

      <button
        className="mobile-bottom-nav-item"
        onClick={() => createPage()}
      >
        <Plus size={22} />
        <span>New</span>
      </button>

      <button
        className={`mobile-bottom-nav-item ${activeView.type === 'settings' ? 'active' : ''}`}
        onClick={() => navigateToSettings()}
      >
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
