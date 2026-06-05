import { useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PageView } from './components/PageView';
import { Settings } from './components/Settings';
import { SearchModal } from './components/SearchModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { MorningDigest } from './components/MorningDigest';
import { Templates } from './components/Templates';
import { MasterCalendar } from './components/MasterCalendar';
import { Vault } from './components/Vault';
import { LandingPage } from './components/LandingPage';
import { AIAgentChat } from './components/AIAgentChat';
import { useStore } from './store';
import { handleBackButton, registerBackButtonHandler } from './utils/backButton';
import { OnboardingTour } from './components/OnboardingTour';


export default function App() {
  const activeView      = useStore((s) => s.activeView);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const settings        = useStore((s) => s.settings);
  const searchOpen    = useStore((s) => s.searchOpen);
  const shortcutsOpen = useStore((s) => s.shortcutsOpen);
  const zenMode       = useStore((s) => s.zenMode);
  const setSearchOpen    = useStore((s) => s.setSearchOpen);
  const setShortcutsOpen = useStore((s) => s.setShortcutsOpen);
  const toggleZenMode    = useStore((s) => s.toggleZenMode);
  const updateSettings   = useStore((s) => s.updateSettings);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar    = useStore((s) => s.toggleSidebar);
  const createPage       = useStore((s) => s.createPage);
  void createPage; // used in MorningDigest via store directly

  // Collapse sidebar by default on mobile screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      useStore.setState({ sidebarCollapsed: true });
    }
  }, []);

  // Register Capacitor native back button handler
  useEffect(() => {
    let listener: any;
    
    const initBackButton = async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { App: CapApp } = await import('@capacitor/app');
        listener = await CapApp.addListener('backButton', () => {
          const handled = handleBackButton();
          if (!handled) {
            const state = useStore.getState();
            if (state.viewHistory.length > 0) {
              state.goBack();
            } else {
              CapApp.exitApp();
            }
          }
        });
      }
    };

    initBackButton();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  // Register handler to close search modal on back button
  useEffect(() => {
    if (!searchOpen) return;
    return registerBackButtonHandler(() => {
      setSearchOpen(false);
      return true; // consumed
    });
  }, [searchOpen, setSearchOpen]);

  // Register handler to close keyboard shortcuts modal on back button
  useEffect(() => {
    if (!shortcutsOpen) return;
    return registerBackButtonHandler(() => {
      setShortcutsOpen(false);
      return true; // consumed
    });
  }, [shortcutsOpen, setShortcutsOpen]);


  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    const apply = (theme: string) => {
      if (theme === 'dark') root.classList.add('dark');
      else if (theme === 'light') root.classList.remove('dark');
      else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    apply(settings.theme);
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const h = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches);
      mq.addEventListener('change', h);
      return () => mq.removeEventListener('change', h);
    }
  }, [settings.theme]);

  // Apply zen mode class to html
  useEffect(() => {
    document.documentElement.classList.toggle('zen', zenMode);
  }, [zenMode]);

  // Apply density class to body
  useEffect(() => {
    const body = document.body;
    body.classList.remove('density-compact', 'density-default', 'density-spacious');
    body.classList.add(`density-${settings.density ?? 'default'}`);
  }, [settings.density]);

  // Automatic silent background synchronization on window focus and every 20 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const autoSync = () => {
      useStore.getState().syncWithBackend().catch(() => {});
    };

    // 1. Sync on window focus / tab visibility change
    window.addEventListener('focus', autoSync);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        autoSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Periodic background poll (every 20 seconds)
    const intervalId = setInterval(autoSync, 20000);

    return () => {
      window.removeEventListener('focus', autoSync);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    const shift = e.shiftKey;
    const inEditor = (e.target as HTMLElement)?.closest?.('.ProseMirror');

    // Cmd+K  → search
    if (meta && !shift && e.key === 'k') { e.preventDefault(); setSearchOpen(true); return; }

    // Cmd+Shift+D → toggle dark mode
    if (meta && shift && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
      return;
    }

    // Cmd+Shift+F (or F11) → zen mode
    if ((meta && shift && e.key.toLowerCase() === 'f') || e.key === 'F11') {
      e.preventDefault();
      toggleZenMode();
      return;
    }

    // Cmd+Shift+M → export markdown (handled in PageView)
    // ? → shortcuts (when not in editor)
    if (e.key === '?' && !inEditor && !searchOpen) {
      setShortcutsOpen(true);
      return;
    }

    // Esc → close modals
    if (e.key === 'Escape') {
      if (searchOpen)    { setSearchOpen(false); return; }
      if (shortcutsOpen) { setShortcutsOpen(false); return; }
      if (zenMode)       { toggleZenMode(); return; }
    }
  }, [searchOpen, shortcutsOpen, zenMode, settings.theme,
      setSearchOpen, setShortcutsOpen, toggleZenMode, updateSettings]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderMain = () => {
    if (activeView.type === 'settings')  return <Settings section={activeView.section} />;
    if (activeView.type === 'calendar') return (
      <div className="main">
        <div className="page-scroll">
          <MasterCalendar />
        </div>
      </div>
    );
    if (activeView.type === 'templates') return (
      <div className="main">
        <div className="page-scroll" style={{ scrollBehavior: 'smooth' }}>
          <Templates />
        </div>
      </div>
    );
    if (activeView.type === 'vault') return (
      <div className="main">
        <div className="page-scroll">
          <Vault />
        </div>
      </div>
    );
    if (activeView.type === 'agent') return (
      <div className="main">
        <div className="page-scroll">
          <AIAgentChat />
        </div>
      </div>
    );
    if (activeView.type === 'page') return <PageView key={activeView.id} pageId={activeView.id} />;

    // Home / morning digest
    return (
      <div className="main">
        <div className="page-scroll">
          <MorningDigest />
        </div>
      </div>
    );
  };

  // Not signed in → show the landing page (all hooks above have already run)
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className={`app ${zenMode ? 'zen-mode' : ''}`}>
      {!zenMode && <Sidebar />}
      {!zenMode && !sidebarCollapsed && (
        <div className="sidebar-backdrop visible" onClick={toggleSidebar} />
      )}
      {renderMain()}

      {/* Overlay modals */}
      {searchOpen    && <SearchModal onClose={() => setSearchOpen(false)} />}
      {shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      <OnboardingTour />

      {zenMode && (
        <button
          className="zen-exit-btn"
          onClick={toggleZenMode}
          title="Exit zen mode (Esc)"
        >
          Exit zen
        </button>
      )}

      {!zenMode && <MobileBottomNav />}
    </div>
  );
}
