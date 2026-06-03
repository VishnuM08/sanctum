import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface Props {
  onClose: () => void;
  editorEl: HTMLElement | null;
}

export function FindInPage({ onClose, editorEl }: Props) {
  const [query,     setQuery]     = useState('');
  const [matches,   setMatches]   = useState<Range[]>([]);
  const [current,   setCurrent]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightClass = 'find-highlight';
  const activeClass    = 'find-highlight-active';

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    if (!editorEl) return;
    editorEl.querySelectorAll('.' + highlightClass).forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
        parent.normalize();
      }
    });
    setMatches([]);
  }, [editorEl]);

  // Highlight all matches
  const doSearch = useCallback((q: string) => {
    clearHighlights();
    if (!editorEl || !q.trim()) return;

    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    const ranges: Range[] = [];
    const lq = q.toLowerCase();

    for (const tn of textNodes) {
      const text = tn.textContent ?? '';
      let idx = 0;
      while ((idx = text.toLowerCase().indexOf(lq, idx)) !== -1) {
        const range = document.createRange();
        range.setStart(tn, idx);
        range.setEnd(tn, idx + q.length);
        ranges.push(range);
        idx += q.length;
      }
    }

    // Wrap each match in a highlight span
    [...ranges].reverse().forEach((range) => {
      const span = document.createElement('mark');
      span.className = highlightClass;
      range.surroundContents(span);
    });

    setMatches(ranges);
    setCurrent(0);
    if (ranges.length > 0) scrollToMatch(0);
  }, [editorEl, clearHighlights]);

  const scrollToMatch = (idx: number) => {
    editorEl?.querySelectorAll('.' + highlightClass).forEach((el, i) => {
      el.classList.toggle(activeClass, i === idx);
      if (i === idx) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const goTo = (idx: number) => {
    const clamped = ((idx % matches.length) + matches.length) % matches.length;
    setCurrent(clamped);
    scrollToMatch(clamped);
  };

  useEffect(() => {
    if (query.trim()) doSearch(query);
    else clearHighlights();
  }, [query]);

  useEffect(() => () => clearHighlights(), [clearHighlights]);

  return (
    <div className="find-in-page">
      <div className="find-in-page-inner">
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          className="find-in-page-input"
          placeholder="Find in page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.shiftKey ? goTo(current - 1) : goTo(current + 1); }
            if (e.key === 'Escape') onClose();
          }}
        />
        {matches.length > 0 && (
          <span className="find-count">{current + 1} / {matches.length}</span>
        )}
        {query && matches.length === 0 && (
          <span className="find-count" style={{ color: 'var(--danger)' }}>No results</span>
        )}
        <button className="find-nav-btn" onClick={() => goTo(current - 1)} disabled={matches.length === 0}><ChevronUp size={13} /></button>
        <button className="find-nav-btn" onClick={() => goTo(current + 1)} disabled={matches.length === 0}><ChevronDown size={13} /></button>
        <button className="find-nav-btn" onClick={() => { clearHighlights(); onClose(); }}><X size={13} /></button>
      </div>
    </div>
  );
}
