import { Home, FileText, Lock, Bell, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40 shadow-xl">
      <div className="flex items-center justify-around px-1 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all min-w-0 active:scale-95 flex-1',
                isActive && 'bg-primary/5'
              )}
            >
              <div className={clsx(
                'p-2 rounded-xl transition-all',
                isActive && 'bg-primary shadow-lg shadow-primary/20'
              )}>
                <Icon className={clsx(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-white' : 'text-muted-foreground'
                )} />
              </div>
              <span className={clsx(
                'text-[10px] font-semibold truncate',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
