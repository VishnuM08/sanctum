import { Home, FileText, Lock, Bell, Sparkles, Settings, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'agent', label: 'AI Agent', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const { mode, toggleMode } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-2rem)] bg-sidebar/55 backdrop-blur-xl border border-sidebar-border/50 rounded-[24px] m-4 sticky top-4 shadow-2xl shadow-black/5 animate-in slide-in-left duration-500">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Personal Vault</h1>
            <p className="text-xs text-muted-foreground">AI-Powered</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 relative border cursor-pointer',
                isActive
                  ? 'bg-primary/[0.08] dark:bg-primary/[0.12] text-primary border-primary/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                  : 'text-sidebar-foreground/80 hover:text-foreground border-transparent hover:bg-sidebar-accent/40 hover:translate-x-1'
              )}
            >
              {isActive && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary shadow-lg shadow-primary" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleMode}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            {mode === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium">{mode === 'dark' ? 'Dark' : 'Light'} Mode</p>
            <p className="text-xs text-muted-foreground">Click to switch</p>
          </div>
        </button>

        {/* User Profile */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">
                {localStorage.getItem('vault-user') ? JSON.parse(localStorage.getItem('vault-user') || '{}').name?.[0]?.toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {localStorage.getItem('vault-user') ? JSON.parse(localStorage.getItem('vault-user') || '{}').name : 'Local User'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {localStorage.getItem('vault-user') ? JSON.parse(localStorage.getItem('vault-user') || '{}').email : 'offline-mode'}
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
