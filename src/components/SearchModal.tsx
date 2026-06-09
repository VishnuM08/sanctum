import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../store';
import type { Page } from '../types';
import { NotionIcon } from './NotionIcon';

interface Props {
  onClose: () => void;
}

export function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const pages = useStore((s) => s.pages);
  const databases = useStore((s) => s.databases);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const getPagePath = useStore((s) => s.getPagePath);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const activePages = pages.filter((p) => !p.isDeleted);

  // Recent pages (last 8 edited)
  const recentPages = [...activePages]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

const stringifyCache = new WeakMap<object, string>();

function getLowercasedContentString(content: any): string {
  if (!content || typeof content !== 'object') return '';
  let cached = stringifyCache.get(content);
  if (cached === undefined) {
    cached = JSON.stringify(content).toLowerCase();
    stringifyCache.set(content, cached);
  }
  return cached;
}

  // Filtered results
  const q = query.trim().toLowerCase();
  const filteredPages: Page[] = q
    ? activePages.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          getLowercasedContentString(p.content).includes(q),
      ).slice(0, 15)
    : [];

  const filteredDbs = q
    ? databases.filter((db) => db.title.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const results = [
    ...filteredPages.map((p) => ({ type: 'page' as const, item: p })),
    ...filteredDbs.map((db) => ({ type: 'database' as const, item: db })),
  ];

  const displayItems = q ? results : recentPages.map((p) => ({ type: 'page' as const, item: p }));

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const open = useCallback((item: typeof displayItems[0]) => {
    if (item.type === 'page') {
      navigateToPage((item.item as Page).id);
    } else {
      // Find page that has this database
      const page = pages.find((p) => p.databaseId === (item.item as typeof databases[0]).id);
      if (page) navigateToPage(page.id);
    }
    onClose();
  }, [navigateToPage, pages, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, displayItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems[selectedIdx]) open(displayItems[selectedIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [displayItems, selectedIdx, open, onClose]);

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="search-input-wrap">
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="search-results">
          {displayItems.length === 0 && (
            <div className="search-empty">
              {q ? `No results for "${query}"` : 'No pages yet'}
            </div>
          )}

          {!q && displayItems.length > 0 && (
            <div className="search-section-label">Recent</div>
          )}
          {q && filteredPages.length > 0 && (
            <div className="search-section-label">Pages</div>
          )}

          {displayItems.slice(0, filteredPages.length).map((item, i) => (
            <SearchResultItem
              key={(item.item as Page).id}
              item={item}
              selected={i === selectedIdx}
              path={getPagePath((item.item as Page).id)}
              onClick={() => open(item)}
            />
          ))}

          {q && filteredDbs.length > 0 && (
            <>
              <div className="search-section-label">Databases</div>
              {filteredDbs.map((db, i) => (
                <div
                  key={db.id}
                  className={`search-result-item ${filteredPages.length + i === selectedIdx ? 'selected' : ''}`}
                  onClick={() => open({ type: 'database', item: db })}
                >
                  <span className="search-result-icon"><NotionIcon icon={db.icon} size="1.2em" /></span>
                  <div className="search-result-text">
                    <div className="search-result-title">{db.title}</div>
                    <div className="search-result-path">Database • {db.rows.length} rows</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SearchResultItemProps {
  item: { type: 'page' | 'database'; item: Page | { id: string; title: string; icon: string } };
  selected: boolean;
  path: Page[];
  onClick: () => void;
}

function SearchResultItem({ item, selected, path, onClick }: SearchResultItemProps) {
  const p = item.item as Page;
  const pathStr = path.slice(0, -1).map((pg) => pg.title || 'Untitled').join(' › ');
  return (
    <div
      className={`search-result-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="search-result-icon"><NotionIcon icon={p.icon || 'notion_page'} size="1.2em" /></span>
      <div className="search-result-text">
        <div className="search-result-title">{p.title || 'Untitled'}</div>
        {pathStr && <div className="search-result-path">{pathStr}</div>}
      </div>
    </div>
  );
}
