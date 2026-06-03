import { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal, Share2, Star, Maximize2, ChevronRight,
  Trash2, Copy, Lock, Unlock, Globe, Type, AlignLeft,
  Link, Download, ExternalLink, History, Search, FileCode,
  CalendarDays, BookMarked,
} from 'lucide-react';
import { useStore } from '../store';
import { Editor } from './Editor';
import { EmojiPicker } from './EmojiPicker';
import { CoverPicker } from './CoverPicker';
import { DatabaseView } from './DatabaseView';
import { FindInPage } from './FindInPage';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { useToast } from './Toast';
import { downloadMarkdown } from '../utils/markdownExport';
import { exportToHtml } from '../utils/exportHtml';
import { AIPanel } from './AIPanel';
import type { Page } from '../types';
import { format } from 'date-fns';

interface Props { pageId: string }

export function PageView({ pageId }: Props) {
  const page          = useStore((s) => s.pages.find((p) => p.id === pageId));
  const updatePage    = useStore((s) => s.updatePage);
  const deletePage    = useStore((s) => s.deletePage);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const getPagePath   = useStore((s) => s.getPagePath);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const createPage    = useStore((s) => s.createPage);
  const zenMode       = useStore((s) => s.zenMode);
  const toggleZenMode = useStore((s) => s.toggleZenMode);
  const allPages       = useStore((s) => s.pages);
  const settings       = useStore((s) => s.settings);
  const saveSnapshot   = useStore((s) => s.saveSnapshot);
  void useStore.getState().setPageAiSummary; // available via store
  const getDailyNoteId = useStore((s) => s.getDailyNoteId);
  const { toast }      = useToast();

  const databaseId = page?.databaseId;
  const database   = useStore((s) =>
    databaseId ? s.databases.find((db) => db.id === databaseId) : undefined,
  );

  const [emojiPickerOpen,  setEmojiPickerOpen]  = useState(false);
  const [coverPickerOpen,  setCoverPickerOpen]   = useState(false);
  const [optionsOpen,      setOptionsOpen]       = useState(false);
  const [shareOpen,        setShareOpen]         = useState(false);
  const [wordCount,        setWordCount]         = useState(0);
  const [aiPanelOpen,      setAiPanelOpen]       = useState(false);
  const [findOpen,         setFindOpen]          = useState(false);
  const [historyOpen,      setHistoryOpen]       = useState(false);
  const editorRef          = useRef<HTMLElement | null>(null);

  // Ctrl+F shortcut for find in page
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setFindOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Auto-save snapshot every 2 minutes of editing
  useEffect(() => {
    if (!page) return;
    const timer = setInterval(() => {
      saveSnapshot(page.id, wordCount);
    }, 120_000);
    return () => clearInterval(timer);
  }, [page?.id, wordCount, saveSnapshot]);

  // @mention hover preview
  useEffect(() => {
    const wrapEl = editorRef.current;
    if (!wrapEl) return;
    let tip: HTMLElement | null = null;
    const onEnter = (e: Event) => {
      const target = (e.target as HTMLElement).closest?.('.page-mention-chip') as HTMLElement | null;
      if (!target) return;
      const pageId = target.getAttribute('data-page-id');
      if (!pageId) return;
      const pg = allPages.find((p) => p.id === pageId);
      if (!pg) return;
      tip = document.createElement('div');
      tip.className = 'mention-preview-tip';
      tip.innerHTML = `<div class="mention-preview-header">${pg.icon || '📄'} ${pg.title || 'Untitled'}</div><div class="mention-preview-sub">${format(pg.updatedAt, 'MMM d, yyyy')}</div>`;
      tip.style.cssText = `position:fixed;z-index:9000;pointer-events:none`;
      const rect = target.getBoundingClientRect();
      tip.style.left = `${rect.left}px`;
      tip.style.top  = `${rect.bottom + 6}px`;
      document.body.appendChild(tip);
    };
    const onLeave = () => { tip?.remove(); tip = null; };
    wrapEl.addEventListener('mouseenter', onEnter, true);
    wrapEl.addEventListener('mouseleave', onLeave, true);
    return () => { wrapEl.removeEventListener('mouseenter', onEnter, true); wrapEl.removeEventListener('mouseleave', onLeave, true); tip?.remove(); };
  }, [allPages]);

  // Listen for AI panel open events from the slash command
  useEffect(() => {
    const handler = () => setAiPanelOpen(true);
    document.addEventListener('ai:open', handler);
    return () => document.removeEventListener('ai:open', handler);
  }, []);

  // Backlinks — pages that mention this page's title
  const backlinks = page ? allPages.filter((p) => {
    if (p.id === pageId || p.isDeleted || !p.title) return false;
    try {
      return JSON.stringify(p.content).toLowerCase().includes(page.title.toLowerCase()) && page.title.length > 2;
    } catch { return false; }
  }) : [];

  // Keyboard shortcut for export
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (page) { downloadMarkdown(page.title, page.icon, page.content); toast('Exported as Markdown'); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [page, toast]);

  if (!page) {
    return (
      <div className="main">
        <div className="home-state"><div className="home-state-icon">🔍</div><div className="home-state-title">Page not found</div></div>
      </div>
    );
  }

  const breadcrumb = getPagePath(page.id);

  const containerClass = [
    'page-container',
    page.isFullWidth ? 'full-width' : '',
    page.isSmallText ? 'small-text' : '',
    `font-${page.font}`,
  ].filter(Boolean).join(' ');

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar (hidden in zen mode) */}
      {!zenMode && (
        <div className="topbar">
          <div className="topbar-breadcrumb">
            {breadcrumb.map((bp, i) => (
              <span key={bp.id} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                {i > 0 && <ChevronRight size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />}
                <span
                  className={`breadcrumb-item ${i === breadcrumb.length - 1 ? 'current' : ''}`}
                  onClick={() => i < breadcrumb.length - 1 && navigateToPage(bp.id)}
                  style={{ cursor: i < breadcrumb.length - 1 ? 'pointer' : 'default' }}
                >
                  <span style={{ marginRight: 4 }}>{bp.icon}</span>
                  {bp.title || 'Untitled'}
                </span>
              </span>
            ))}
          </div>

          <div className="topbar-actions">
            <button
              className="topbar-btn"
              onClick={() => { toggleFavorite(page.id); toast(page.isFavorite ? 'Removed from favorites' : 'Added to favorites'); }}
              title="Favorite"
            >
              <Star size={15} fill={page.isFavorite ? 'currentColor' : 'none'} style={{ color: page.isFavorite ? '#f5c518' : 'currentColor' }} />
            </button>

            <button className="topbar-btn" onClick={() => setFindOpen((v) => !v)} title="Find in page (⌘F)">
              <Search size={14} />
            </button>
            <button className="topbar-btn" onClick={() => setHistoryOpen((v) => !v)} title="Version history">
              <History size={14} />
            </button>
            <button className="topbar-btn" onClick={() => getDailyNoteId()} title="Open today's daily note">
              <CalendarDays size={14} />
            </button>
            <button className="topbar-btn" onClick={toggleZenMode} title="Zen mode (⌘⇧F)">
              <Maximize2 size={15} />
            </button>

            <button className="topbar-btn primary" onClick={() => setShareOpen((v) => !v)}>
              <Share2 size={14} /><span>Share</span>
            </button>

            <div style={{ position: 'relative' }}>
              <button className="topbar-btn" onClick={() => setOptionsOpen((v) => !v)}>
                <MoreHorizontal size={16} />
              </button>
              {optionsOpen && (
                <PageOptionsMenu
                  page={page}
                  onClose={() => setOptionsOpen(false)}
                  onDelete={() => { deletePage(page.id); setOptionsOpen(false); toast('Moved to trash'); }}
                  onFavorite={() => { toggleFavorite(page.id); setOptionsOpen(false); }}
                  onDuplicate={() => {
                    const id = createPage(page.parentId);
                    updatePage(id, { title: `${page.title} (copy)`, icon: page.icon, content: page.content, font: page.font });
                    toast('Page duplicated'); setOptionsOpen(false);
                  }}
                  onExportMd={() => { downloadMarkdown(page.title, page.icon, page.content); toast('Exported as Markdown'); setOptionsOpen(false); }}
                  onExportHtml={() => {
                    const pm = document.querySelector('.ProseMirror');
                    exportToHtml(page.title, page.icon, pm?.innerHTML ?? '');
                    toast('Exported as HTML'); setOptionsOpen(false);
                  }}
                  onSaveTemplate={() => {
                    // Add to user-saved templates via localStorage
                    const existing = JSON.parse(localStorage.getItem('user-templates') ?? '[]');
                    existing.unshift({ id: page.id, name: page.title || 'Untitled', icon: page.icon, content: page.content, savedAt: Date.now() });
                    localStorage.setItem('user-templates', JSON.stringify(existing.slice(0, 20)));
                    toast('Saved as template'); setOptionsOpen(false);
                  }}
                  onCopyLink={() => { navigator.clipboard.writeText(window.location.href); toast('Link copied'); setOptionsOpen(false); }}
                  onUpdatePage={updatePage}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {shareOpen    && <SharePopover page={page} onClose={() => setShareOpen(false)} updatePage={updatePage} toast={toast} />}

      {/* Version history side panel */}
      {historyOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 54 }} onClick={() => setHistoryOpen(false)} />
          <div style={{ position: 'absolute', top: 45, right: 0, zIndex: 55, height: 'calc(100% - 45px)' }}>
            <VersionHistoryPanel
              page={page}
              onRestore={(content) => { updatePage(page.id, { content }); setHistoryOpen(false); toast('Restored to previous version'); }}
              onClose={() => setHistoryOpen(false)}
            />
          </div>
        </>
      )}

      {/* AI Panel */}
      {aiPanelOpen && (
        <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 56 }}>
          <AIPanel
            pageTitle={page.title}
            pageContent={page.content}
            onInsert={(text) => {
              const pm = document.querySelector('.ProseMirror') as HTMLElement;
              if (pm) { pm.focus(); document.execCommand('insertText', false, '\n' + text); }
            }}
            onClose={() => setAiPanelOpen(false)}
          />
        </div>
      )}

      <div className="page-scroll">
        {/* Cover */}
        {page.cover && (
          <div className="page-cover" style={{ background: page.cover.value }}>
            <div className="page-cover-actions">
              <button className="cover-action-btn" onClick={() => setCoverPickerOpen(true)}>Change cover</button>
              <button className="cover-action-btn" onClick={() => updatePage(page.id, { cover: undefined })}>Remove</button>
            </div>
          </div>
        )}

        <div className={containerClass}>
          {coverPickerOpen && (
            <CoverPicker
              current={page.cover}
              onChange={(cover) => { updatePage(page.id, { cover }); setCoverPickerOpen(false); }}
              onClose={() => setCoverPickerOpen(false)}
            />
          )}

          {/* Lock banner */}
          {page.isLocked && (
            <div className="lock-banner">
              <Lock size={13} />
              This page is locked. Click to unlock.
              <button onClick={() => updatePage(page.id, { isLocked: false })}>Unlock</button>
            </div>
          )}

          {/* Page header */}
          <div className="page-header">
            {page.icon ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button className="page-icon-btn" onClick={() => setEmojiPickerOpen((v) => !v)}>{page.icon}</button>
                {emojiPickerOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 6 }}>
                    <EmojiPicker
                      onSelect={(e) => { updatePage(page.id, { icon: e }); setEmojiPickerOpen(false); }}
                      onClose={() => setEmojiPickerOpen(false)}
                      onRemove={() => { updatePage(page.id, { icon: '' }); setEmojiPickerOpen(false); }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <button className="page-header-add-btn" onClick={() => { updatePage(page.id, { icon: '📄' }); setEmojiPickerOpen(true); }}>
                  😊 Add icon
                </button>
                {!page.cover && (
                  <button className="page-header-add-btn" onClick={() => setCoverPickerOpen(true)}>
                    🖼️ Add cover
                  </button>
                )}
              </div>
            )}

            <AutosizeTextarea
              className="page-title"
              value={page.title}
              placeholder="Untitled"
              onChange={(v) => updatePage(page.id, { title: v })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (document.querySelector('.ProseMirror') as HTMLElement | null)?.focus();
                }
              }}
              disabled={page.isLocked}
            />
          </div>

          {/* Content */}
          {/* Find in page bar */}
          {findOpen && (
            <FindInPage
              editorEl={editorRef.current}
              onClose={() => setFindOpen(false)}
            />
          )}

          {database ? (
            <DatabaseView database={database} />
          ) : (
            <div ref={(el) => { editorRef.current = el; }}>
              <Editor
                key={page.id}
                pageId={page.id}
                initialContent={page.content}
                onChange={(json) => updatePage(page.id, { content: json })}
                onWordCountChange={setWordCount}
                readOnly={page.isLocked}
                typewriterMode={settings.typewriterMode}
              />
            </div>
          )}

          {/* Footer */}
          <div className="page-footer">
            <span>Last edited {format(page.updatedAt, 'MMM d, yyyy')}</span>
            {wordCount > 0 && (
              <span>{wordCount} words · {Math.ceil(wordCount / 200)} min read</span>
            )}
            {database && <span>{database.rows.length} rows</span>}
          </div>

          {/* Backlinks */}
          {backlinks.length > 0 && (
            <div className="backlinks-section">
              <div className="backlinks-title">
                <ExternalLink size={13} /> {backlinks.length} backlink{backlinks.length > 1 ? 's' : ''}
              </div>
              <div className="backlinks-list">
                {backlinks.map((p) => (
                  <button key={p.id} className="backlink-item" onClick={() => navigateToPage(p.id)}>
                    <span>{p.icon || '📄'}</span>
                    <span>{p.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Auto-resize textarea ────────────────────────────────────────────────────

function AutosizeTextarea({ value, placeholder, onChange, onKeyDown, className, disabled }: {
  value: string; placeholder: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = `${ref.current.scrollHeight}px`; }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      rows={1}
      disabled={disabled}
      style={{ overflow: 'hidden', resize: 'none', opacity: disabled ? 0.6 : 1 }}
    />
  );
}

// ── Options menu ─────────────────────────────────────────────────────────────

function PageOptionsMenu({ page, onClose, onDelete, onFavorite, onDuplicate, onExportMd, onCopyLink, onUpdatePage, onSaveTemplate, onExportHtml }: {
  page: Page; onClose: () => void; onDelete: () => void; onFavorite: () => void;
  onDuplicate: () => void; onExportMd: () => void; onCopyLink: () => void;
  onSaveTemplate: () => void; onExportHtml: () => void;
  onUpdatePage: (id: string, patch: Partial<Page>) => void;
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
      <div className="dropdown-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50 }} onClick={(e) => e.stopPropagation()}>
        <button className="dropdown-item" onClick={onFavorite}>
          <Star size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {page.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>
        <button className="dropdown-item" onClick={onDuplicate}>
          <Copy size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Duplicate
        </button>
        <button className="dropdown-item" onClick={onCopyLink}>
          <Link size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Copy link
        </button>
        <button className="dropdown-item" onClick={onExportMd}>
          <Download size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Export as Markdown
          <span className="dropdown-item-kbd">⌘⇧M</span>
        </button>
        <button className="dropdown-item" onClick={onExportHtml}>
          <FileCode size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Export as HTML
        </button>
        <button className="dropdown-item" onClick={onSaveTemplate}>
          <BookMarked size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> Save as template
        </button>
        <div className="dropdown-sep" />
        <div style={{ padding: '4px 10px 2px', fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customize</div>
        <button className="dropdown-item" onClick={() => {
          const order: ('default' | 'serif' | 'mono')[] = ['default', 'serif', 'mono'];
          onUpdatePage(page.id, { font: order[(order.indexOf(page.font) + 1) % order.length] });
        }}>
          <Type size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          Font: <span style={{ textTransform: 'capitalize', marginLeft: 2 }}>{page.font}</span>
        </button>
        <button className="dropdown-item" onClick={() => onUpdatePage(page.id, { isFullWidth: !page.isFullWidth })}>
          <Maximize2 size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {page.isFullWidth ? 'Centered layout' : 'Full width'}
        </button>
        <button className="dropdown-item" onClick={() => onUpdatePage(page.id, { isSmallText: !page.isSmallText })}>
          <AlignLeft size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {page.isSmallText ? 'Default text size' : 'Small text'}
        </button>
        <div className="dropdown-sep" />
        <button className="dropdown-item" onClick={() => { onUpdatePage(page.id, { isLocked: !page.isLocked }); onClose(); }}>
          {page.isLocked ? <Unlock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
          {page.isLocked ? 'Unlock page' : 'Lock page'}
        </button>
        <div className="dropdown-sep" />
        <button className="dropdown-item danger" onClick={onDelete}>
          <Trash2 size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} /> Move to Trash
        </button>
      </div>
    </>
  );
}

// ── Share popover ─────────────────────────────────────────────────────────────

function SharePopover({ page, onClose, updatePage, toast }: {
  page: Page; onClose: () => void;
  updatePage: (id: string, patch: Partial<Page>) => void;
  toast: (msg: string) => void;
}) {
  const [email, setEmail] = useState('');
  const url = `https://notebook.app/share/${page.id}`;
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={onClose} />
      <div className="share-modal" style={{ position: 'absolute', top: 50, right: 12, zIndex: 51 }}>
        <h3>Share "{page.title || 'Untitled'}"</h3>
        <div className="share-input-row">
          <input className="share-input" placeholder="Add people by email..." value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="settings-btn primary" style={{ whiteSpace: 'nowrap' }}>Invite</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <Globe size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Publish to web</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Anyone with the link can view</div>
            </div>
          </div>
          <label className="settings-toggle">
            <input type="checkbox" checked={page.isPublished} onChange={() => updatePage(page.id, { isPublished: !page.isPublished })} />
            <span className="settings-toggle-slider" />
          </label>
        </div>
        {page.isPublished && (
          <div className="share-link-row">
            <input readOnly value={url} style={{ fontSize: 12 }} />
            <button className="settings-btn secondary" style={{ padding: '3px 10px', fontSize: 12, whiteSpace: 'nowrap' }} onClick={() => { navigator.clipboard.writeText(url); toast('Link copied'); }}>Copy</button>
          </div>
        )}
      </div>
    </>
  );
}
