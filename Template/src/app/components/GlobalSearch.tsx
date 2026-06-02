import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Lock, Bell, Clock, Star, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { NotionPage, VaultEntry, Reminder } from '../types';
import { clsx } from 'clsx';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (pageId: string) => void;
}

type SearchResult = {
  id: string;
  type: 'page' | 'vault' | 'reminder';
  title: string;
  preview: string;
  icon: string;
  favorite?: boolean;
  timestamp: string;
};

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [pages] = useLocalStorage<NotionPage[]>('notion-pages', []);
  const [vault] = useLocalStorage<VaultEntry[]>('vault', []);
  const [reminders] = useLocalStorage<Reminder[]>('reminders', []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults: SearchResult[] = [];

  if (query.trim()) {
    const lowerQuery = query.toLowerCase();

    // Search pages
    pages.forEach(page => {
      const titleMatch = page.title.toLowerCase().includes(lowerQuery);
      const contentMatch = page.blocks.some(b =>
        b.content.toLowerCase().includes(lowerQuery)
      );
      const tagMatch = page.tags?.some(t => t.toLowerCase().includes(lowerQuery));

      if (titleMatch || contentMatch || tagMatch) {
        const preview = page.blocks
          .find(b => b.content.toLowerCase().includes(lowerQuery))?.content
          || page.blocks[0]?.content
          || '';

        searchResults.push({
          id: page.id,
          type: 'page',
          title: page.title,
          preview: preview.slice(0, 100),
          icon: page.icon,
          favorite: page.favorite,
          timestamp: page.updatedAt,
        });
      }
    });

    // Search vault
    vault.forEach(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const typeMatch = item.type.toLowerCase().includes(lowerQuery);

      if (titleMatch || typeMatch) {
        searchResults.push({
          id: item.id,
          type: 'vault',
          title: item.title,
          preview: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} • ${item.createdAt}`,
          icon: '🔒',
          timestamp: item.createdAt,
        });
      }
    });

    // Search reminders
    reminders.forEach(reminder => {
      const titleMatch = reminder.title.toLowerCase().includes(lowerQuery);
      const contextMatch = reminder.context?.toLowerCase().includes(lowerQuery);

      if (titleMatch || contextMatch) {
        searchResults.push({
          id: reminder.id,
          type: 'reminder',
          title: reminder.title,
          preview: reminder.context || `Remind at ${reminder.remindAt}`,
          icon: '🔔',
          timestamp: reminder.createdAt,
        });
      }
    });
  }

  // Sort by relevance and recency
  searchResults.sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'page' && onNavigate) {
      onNavigate(result.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-24 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[600px] overflow-hidden animate-in slide-in-up duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everything..."
              className="w-full pl-12 pr-12 py-3 bg-transparent text-lg outline-none"
            />
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-secondary rounded">Cmd/Ctrl K</kbd>
            <span>to toggle</span>
            <span className="ml-auto">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[480px]">
          {!query.trim() ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Type to search across pages, vault, and reminders
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={clsx(
                    "w-full flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-all text-left group animate-in slide-in-up",
                    result.type === 'page' && "cursor-pointer"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                        {result.title}
                      </h4>
                      {result.favorite && (
                        <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.preview}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-lg flex items-center gap-1",
                        result.type === 'page' && "bg-blue-500/10 text-blue-600",
                        result.type === 'vault' && "bg-purple-500/10 text-purple-600",
                        result.type === 'reminder' && "bg-orange-500/10 text-orange-600"
                      )}>
                        {result.type === 'page' && <FileText className="w-3 h-3" />}
                        {result.type === 'vault' && <Lock className="w-3 h-3" />}
                        {result.type === 'reminder' && <Bell className="w-3 h-3" />}
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(result.timestamp)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
