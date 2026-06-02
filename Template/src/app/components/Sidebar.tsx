import { Home, FileText, Lock, Bell, Sparkles, Settings, ChevronDown, Search, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'notes', label: 'Pages', icon: FileText },
  { id: 'vault', label: 'Vault', icon: Lock },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'agent', label: 'AI Agent', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { mode } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-[#f7f7f5] dark:bg-[#202020] border-r border-[#e9e9e7] dark:border-[#373737] sticky top-0">
      {/* Workspace Selector */}
      <div className="px-3 py-3">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">P</span>
          </div>
          <span className="text-sm font-medium text-[#37352f] dark:text-[#e6e6e3] flex-1 truncate">
            Personal Vault
          </span>
          <ChevronDown className="w-4 h-4 text-[#37352f99] dark:text-[#9b9a97] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </button>
      </div>

      {/* Search & New */}
      <div className="px-3 pb-2 space-y-1">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm">
          <Search className="w-4 h-4 flex-shrink-0" />
          <span>Search</span>
          <span className="ml-auto text-xs opacity-60">⌘K</span>
        </button>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm">
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>New Page</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-normal transition-colors',
                isActive
                  ? 'bg-[#e9e9e7] dark:bg-[#373737] text-[#37352f] dark:text-[#e6e6e3]'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-3 border-t border-[#e9e9e7] dark:border-[#373737]">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">U</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-[#37352f] dark:text-[#e6e6e3] truncate">User</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
