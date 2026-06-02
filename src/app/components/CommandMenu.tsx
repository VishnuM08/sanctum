import { useEffect } from 'react';
import { Command } from 'cmdk';
import { Home, FileText, Lock, Bell, Sparkles, Settings, Moon, Sun, LogOut, Terminal, Keyboard } from 'lucide-react';
import { Card } from './Card';
import { useTheme } from '../context/ThemeContext';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export function CommandMenu({ isOpen, onClose, onNavigate, onLogout }: CommandMenuProps) {
  const { mode, toggleMode } = useTheme();

  // Handle global key shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const runCommand = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-card/75 backdrop-blur-xl border border-border/80 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Command Menu" className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Terminal className="w-5 h-5 text-muted-foreground" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex-1 py-4 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-mono text-muted-foreground select-none">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => onNavigate('dashboard'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
                <span>Go to Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => onNavigate('notes'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Go to Notes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => onNavigate('vault'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span>Go to Secure Vault</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => onNavigate('reminders'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span>Go to Reminders</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => onNavigate('agent'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span>Go to AI Agent</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => onNavigate('settings'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Go to Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Preferences & Actions" className="px-2 py-1.5 pt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => toggleMode())}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent text-foreground cursor-pointer"
              >
                {mode === 'dark' ? (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                )}
                <span>Toggle {mode === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </Command.Item>
              {onLogout && (
                <Command.Item
                  onSelect={() => runCommand(() => onLogout())}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-destructive/10 text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-destructive" />
                  <span>Sign Out from Account</span>
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>
          
          <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-t border-border text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              Use arrow keys to navigate
            </span>
            <span>Press Enter to select</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
