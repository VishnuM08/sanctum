import { Home, FileText, Lock, Bell, Sparkles, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'agent', label: 'Agent', icon: Sparkles },
  { id: 'dark-mode', label: 'Theme', icon: null }, // Special item for dark mode toggle
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  const { mode, toggleMode } = useTheme();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 shadow-xl">
      <div className="flex items-center justify-around px-1 py-3 pb-safe">
        {navItems.map((item) => {
          // Special handling for dark mode toggle
          if (item.id === 'dark-mode') {
            const Icon = mode === 'dark' ? Moon : Sun;
            return (
              <button
                key={item.id}
                onClick={toggleMode}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-0 active:scale-95"
              >
                <div className="p-2 rounded-lg transition-all bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium truncate text-primary">{item.label}</span>
              </button>
            );
          }

          const Icon = item.icon!;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-w-0 active:scale-95',
                isActive && 'bg-primary/10'
              )}
            >
              <div className={clsx(
                'p-2 rounded-lg transition-all',
                isActive && 'bg-primary shadow-lg shadow-primary/30'
              )}>
                <Icon className={clsx(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-white' : 'text-muted-foreground'
                )} />
              </div>
              <span className={clsx(
                'text-xs font-medium truncate',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
