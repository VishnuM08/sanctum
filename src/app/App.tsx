import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { Notes } from './pages/Notes';
import { Vault } from './pages/Vault';
import { Reminders } from './pages/Reminders';
import { Agent } from './pages/Agent';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { CommandMenu } from './components/CommandMenu';
import { api } from './utils/api';
import { ShieldAlert, Cloud, WifiOff, RefreshCw, Search, Home, FileText, Lock, Bell, Sparkles, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'agent', label: 'AI Agent', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [hasUnsynced, setHasUnsynced] = useState(false);

  const checkUnsyncedData = () => {
    try {
      const notesRaw = localStorage.getItem('notes');
      const vaultRaw = localStorage.getItem('vault');
      const remindersRaw = localStorage.getItem('reminders');

      const hasNotes = notesRaw ? JSON.parse(notesRaw).some((n: any) => !n.id.includes('-')) : false;
      const hasVault = vaultRaw ? JSON.parse(vaultRaw).some((v: any) => !v.id.includes('-')) : false;
      const hasRem = remindersRaw ? JSON.parse(remindersRaw).some((r: any) => !r.id.includes('-')) : false;

      return hasNotes || hasVault || hasRem;
    } catch {
      return false;
    }
  };

  const checkConnection = async () => {
    setIsChecking(true);
    const online = await api.checkServer();
    setIsOnline(online);
    
    if (online) {
      const token = api.getToken();
      setIsAuthenticated(!!token);
      if (token) {
        setHasUnsynced(checkUnsyncedData());
      }
    } else {
      setIsAuthenticated(false);
      setHasUnsynced(false);
    }
    setIsChecking(false);
  };

  const handleSync = async () => {
    try {
      const vaultRaw = localStorage.getItem('vault');
      const hasUnsyncedVault = vaultRaw ? JSON.parse(vaultRaw).some((v: any) => !v.id.includes('-')) : false;

      let vaultPassword = '';
      if (hasUnsyncedVault) {
        const pw = prompt('You have unsynced secure vault entries. Please enter your master password to decrypt and sync them. (Leave empty to skip vault items)');
        if (pw) vaultPassword = pw;
      }

      toast.loading('Syncing local data...');
      await api.syncLocalData(vaultPassword);
      toast.dismiss();
      toast.success('Local data successfully synced to the cloud!');
      setHasUnsynced(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.dismiss();
      toast.error('Synchronization failed');
    }
  };

  useEffect(() => {
    checkConnection();
    // Re-check every 30 seconds
    const interval = setInterval(async () => {
      const online = await api.checkServer();
      setIsOnline(online);
      if (online && api.getToken()) {
        setHasUnsynced(checkUnsyncedData());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener to open Command Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    toast.success('Synced with server');
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    checkConnection();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'notes':
        return <Notes />;
      case 'vault':
        return <Vault />;
      case 'reminders':
        return <Reminders />;
      case 'agent':
        return <Agent />;
      case 'settings':
        return <Settings onLogout={handleLogout} />;
      default:
        return <Dashboard />;
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Checking server status...</p>
        </div>
      </div>
    );
  }

  if (isOnline && !isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-primary/10 animate-gradient" />
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Sleek Top Sticky Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-card/85 backdrop-blur-md border-b border-border animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Lock className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Sanctum</span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer',
                    isActive
                      ? 'bg-secondary text-foreground border-border/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/40'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Spotlight Search shortcut trigger button */}
            <button
              onClick={() => setShowCommandMenu(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary/80 border border-border/50 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Command...</span>
              <kbd className="text-[10px] font-mono border border-border px-1.5 py-0.5 rounded bg-card leading-none">Ctrl+K</kbd>
            </button>

            {isOnline && isAuthenticated ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm">
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cloud Connected</span>
              </div>
            ) : (
              <button 
                onClick={checkConnection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                title="Click to retry connection"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Local Offline Mode</span>
              </button>
            )}

            {/* Logout Shortcut (if authenticated) */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-secondary/85 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-border/40 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        {renderPage()}
      </main>

      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Global Command Spotlight Overlay */}
      <CommandMenu 
        isOpen={showCommandMenu} 
        onClose={() => setShowCommandMenu(false)} 
        onNavigate={setCurrentPage} 
        onLogout={isAuthenticated ? handleLogout : undefined} 
      />

      {/* Floating Sync alert badge */}
      {hasUnsynced && isOnline && isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-up duration-300">
          <Card className="p-4 border border-border bg-card/90 backdrop-blur-md shadow-2xl flex items-center gap-4 max-w-sm">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <div className="text-xs">
              <span className="font-semibold block mb-0.5 text-foreground">Unsynced Edits Detected</span>
              <span className="text-muted-foreground text-[10px]">Merge local changes created offline with server?</span>
            </div>
            <Button size="xs" onClick={handleSync}>Sync</Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider />
      <AppContent />
    </ThemeProvider>
  );
}