import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight, Plus, Search, Trash2, Star, Settings,
  MoreHorizontal, Home, ChevronsLeft, ChevronsRight,
  Database, LayoutTemplate, CalendarDays, Bell, Lock,
  Globe, Zap, Upload, GripVertical, Eye, EyeOff,
  Clock, ChevronDown, ShieldCheck, Bot, Sparkles,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { TrashModal } from './TrashModal';
import { InboxModal } from './InboxModal';
import { ImportModal } from './ImportModal';
import { useToast } from './Toast';
import { formatDistanceToNow, isToday } from 'date-fns';
import type { Page } from '../types';
import { NotionIcon } from './NotionIcon';

// ── Section toggle state ────────────────────────────────────────────────────
interface Sections {
  favorites: boolean; recent: boolean; workspace: boolean;
  private: boolean; shared: boolean; aiDigest: boolean; vault: boolean;
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const sidebarCollapsed   = useStore((s) => s.sidebarCollapsed);
  const sidebarWidth       = useStore((s) => s.sidebarWidth);
  const toggleSidebar      = useStore((s) => s.toggleSidebar);
  const setSidebarWidth    = useStore((s) => s.setSidebarWidth);
  const workspace          = useStore((s) => s.workspace);
  const setSearchOpen      = useStore((s) => s.setSearchOpen);
  const navigateToSettings = useStore((s) => s.navigateToSettings);
  const createPage         = useStore((s) => s.createPage);
  const updatePage         = useStore((s) => s.updatePage);
  const topLevelPageIds    = useStore((s) => s.topLevelPageIds);
  const reorderTopLevel    = useStore((s) => s.reorderTopLevelPages);
  const reorderFavorites   = useStore((s) => s.reorderFavorites);
  const pages              = useStore((s) => s.pages);
  const databases          = useStore((s) => s.databases);
  const activeView         = useStore((s) => s.activeView);
  const navigate           = useStore((s) => s.navigate);
  const navigateToPage     = useStore((s) => s.navigateToPage);
  const visitHistory       = useStore((s) => s.visitHistory);
  const inboxItems         = useStore((s) => s.inboxItems);
  const favoriteOrder      = useStore((s) => s.favoriteOrder);
  const vaultInitialized   = useStore((s) => s.vaultMeta.initialized);
  const vaultUnlocked      = useStore((s) => s.vaultUnlocked);
  const { toast }          = useToast();

  const [trashOpen,    setTrashOpen]    = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [inboxOpen,   setInboxOpen]   = useState(false);
  const [importOpen,  setImportOpen]  = useState(false);
  const [filterText,  setFilterText]  = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; page: Page } | null>(null);
  const [sections, setSections] = useState<Sections>({
    favorites: true, recent: true, workspace: true,
    private: false, shared: false, aiDigest: false, vault: false,
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const resizingRef   = useRef(false);
  const startXRef     = useRef(0);
  const startWidthRef = useRef(0);

  const toggleSection = (key: keyof Sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const activePages = pages.filter((p) => !p.isDeleted);

  // Ordered favorites (using favoriteOrder array, then fallback to isFavorite flag)
  const favoritePages = favoriteOrder.length > 0
    ? favoriteOrder.map((id) => activePages.find((p) => p.id === id && p.isFavorite)).filter((p): p is Page => !!p)
    : activePages.filter((p) => p.isFavorite);

  const recentPages = visitHistory
    .map((id) => activePages.find((p) => p.id === id))
    .filter((p): p is Page => Boolean(p))
    .slice(0, 5);

  const workspacePages = topLevelPageIds
    .map((id) => activePages.find((p) => p.id === id))
    .filter((p): p is Page => Boolean(p && !p.isPrivate));

  const privatePages  = activePages.filter((p) => p.isPrivate && !p.parentId);
  const sharedPages   = activePages.filter((p) => p.isPublished && !p.isPrivate);
  const vaultPages    = activePages.filter((p) => p.expiresAt);

  const filteredWorkspace = filterText
    ? activePages.filter((p) => (p.title || 'Untitled').toLowerCase().includes(filterText.toLowerCase()))
    : workspacePages;

  const dueTodayCount = databases.reduce((acc, db) => {
    const dp = db.properties.find((pr) => pr.type === 'date');
    if (!dp) return acc;
    return acc + db.rows.filter((r) => {
      const d = r.values[dp.id] as string | null;
      return d && isToday(new Date(d));
    }).length;
  }, 0);

  const unreadCount = inboxItems.filter((i) => !i.read).length;

  // Resize handle
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      setSidebarWidth(startWidthRef.current + (ev.clientX - startXRef.current));
    };
    const onUp = () => {
      resizingRef.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth, setSidebarWidth]);

  // DnD sensors — require 4px drag before activating to avoid click conflicts
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // ── Drag handlers for WORKSPACE top-level ─────────────────────────────────
  const handleWorkspaceDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = topLevelPageIds.indexOf(active.id as string);
    const newIdx = topLevelPageIds.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderTopLevel(arrayMove(topLevelPageIds, oldIdx, newIdx));
    }
  };

  // ── Drag handlers for FAVORITES ───────────────────────────────────────────
  const favIds = favoritePages.map((p) => p.id);
  const handleFavDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = favIds.indexOf(active.id as string);
    const newIdx = favIds.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderFavorites(arrayMove(favIds, oldIdx, newIdx));
    }
  };

  // Quick Capture
  const quickCapture = () => {
    const id = createPage(null);
    updatePage(id, {
      title: `Capture — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      icon: '⚡',
    });
    toast('Quick capture page created');
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  return (
    <>
      {sidebarCollapsed && (
        <button className="sidebar-collapse-tab" onClick={toggleSidebar} title="Open sidebar">
          <ChevronsRight size={14} />
        </button>
      )}

      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        <div className="sidebar-inner">
          {/* Workspace header */}
          <div className="workspace-header" onClick={() => navigateToSettings('workspace')}>
            <div className="workspace-icon">
              <NotionIcon icon={workspace.icon} size="1.2em" style={{ display: 'block' }} />
            </div>
            <span className="workspace-name">{workspace.name}</span>
            <button
              style={{ marginLeft: 'auto', color: 'var(--text-faint)', flexShrink: 0, padding: 4, borderRadius: 4 }}
              onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
            >
              <ChevronsLeft size={14} />
            </button>
          </div>

          {/* Primary nav */}
          <div className="sidebar-nav">
            <button className="sidebar-nav-item" onClick={() => setSearchOpen(true)}>
              <span className="nav-icon"><Search size={14} /></span>
              <span>Search</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)' }}>⌘K</span>
            </button>
            <button className={`sidebar-nav-item ${activeView.type === 'home' ? 'active' : ''}`} onClick={() => navigate({ type: 'home' })}>
              <span className="nav-icon"><Home size={14} /></span><span>Home</span>
            </button>
            <button className={`sidebar-nav-item ${activeView.type === 'calendar' ? 'active' : ''}`} onClick={() => navigate({ type: 'calendar' })}>
              <span className="nav-icon"><CalendarDays size={14} /></span><span>Calendar</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => setInboxOpen(true)}>
              <span className="nav-icon"><Bell size={14} /></span>
              <span>Inbox</span>
              {unreadCount > 0 && <span className="filter-badge" style={{ marginLeft: 'auto' }}>{unreadCount}</span>}
            </button>
            <button className={`sidebar-nav-item ${activeView.type === 'vault' ? 'active' : ''}`} onClick={() => navigate({ type: 'vault' })}>
              <span className="nav-icon"><ShieldCheck size={14} /></span>
              <span>Vault</span>
              {vaultInitialized && !vaultUnlocked && <Lock size={11} style={{ marginLeft: 'auto', color: 'var(--text-faint)' }} />}
            </button>
            <button className={`sidebar-nav-item ${activeView.type === 'agent' ? 'active' : ''}`} onClick={() => navigate({ type: 'agent' })}>
              <span className="nav-icon"><Bot size={14} /></span>
              <span>AI Agent</span>
            </button>
            <button className={`sidebar-nav-item ${activeView.type === 'settings' ? 'active' : ''}`} onClick={() => navigateToSettings()}>
              <span className="nav-icon"><Settings size={14} /></span><span>Settings</span>
            </button>

            {/* Templates dropdown */}
            <button
              className={`sidebar-nav-item ${activeView.type === 'templates' ? 'active' : ''}`}
              onClick={() => setTemplatesOpen((v) => !v)}
            >
              <span className="nav-icon"><LayoutTemplate size={14} /></span>
              <span>Templates</span>
              <ChevronDown size={11} style={{ marginLeft: 'auto', transform: templatesOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 180ms', color: 'var(--text-faint)' }} />
            </button>

            {/* Category sub-items */}
            {templatesOpen && (
              <div className="templates-nav-dropdown">
                <button
                  className={`template-nav-item ${activeView.type === 'templates' && !(activeView as { type: 'templates'; category?: string }).category ? 'active' : ''}`}
                  onClick={() => navigate({ type: 'templates' })}
                >
                  <span>🗂️</span> All templates <span className="template-nav-count">{TEMPLATE_CATEGORIES.reduce((s, c) => s + c.count, 0)}</span>
                </button>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    className={`template-nav-item ${activeView.type === 'templates' && (activeView as { type: 'templates'; category?: string }).category === cat.label ? 'active' : ''}`}
                    onClick={() => navigate({ type: 'templates', category: cat.label } as { type: 'templates'; category: string })}
                  >
                    <span><NotionIcon icon={cat.icon} size="1.1em" /></span>
                    <span>{cat.label}</span>
                    <span className="template-nav-count">{cat.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-scroll">
            {/* ── FAVORITES (sortable) ───────────────────────────────── */}
            {favoritePages.length > 0 && (
              <>
                <SectionHeader label="Favorites" icon={<Star size={11} />} open={sections.favorites} onToggle={() => toggleSection('favorites')} />
                {sections.favorites && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e: DragStartEvent) => setDraggingId(e.active.id as string)}
                    onDragEnd={handleFavDragEnd}
                  >
                    <SortableContext items={favIds} strategy={verticalListSortingStrategy}>
                      {favoritePages.map((p) => (
                        <SortablePageRow key={p.id} page={p} depth={0} showTime onContextMenu={(x, y) => setContextMenu({ x, y, page: p })} />
                      ))}
                    </SortableContext>
                    {draggingId && (
                      <DragOverlay dropAnimation={null}>
                        <DragGhost label={favoritePages.find((p) => p.id === draggingId)?.title || 'Page'} />
                      </DragOverlay>
                    )}
                  </DndContext>
                )}
              </>
            )}

            {/* ── JUMP BACK IN ─────────────────────────────────────────── */}
            {recentPages.length > 0 && (
              <>
                <SectionHeader label="Jump back in" icon={<Clock size={11} />} open={sections.recent} onToggle={() => toggleSection('recent')} />
                {sections.recent && recentPages.map((p) => (
                  <FlatPageRow key={p.id} page={p} depth={0} showTime onContextMenu={(x, y) => setContextMenu({ x, y, page: p })} />
                ))}
              </>
            )}

            {/* ── FILTER ───────────────────────────────────────────────── */}
            <div className="sidebar-filter-wrap">
              <Search size={11} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              <input
                className="sidebar-filter-input"
                placeholder="Filter pages…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              {filterText && (
                <button onClick={() => setFilterText('')} style={{ color: 'var(--text-faint)', lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* ── WORKSPACE (sortable top-level) ────────────────────────── */}
            <SectionHeader
              label="Workspace"
              open={sections.workspace}
              onToggle={() => toggleSection('workspace')}
              action={<button className="page-tree-action-btn" onClick={() => createPage(null)} title="New page"><Plus size={12} /></button>}
            />
            {sections.workspace && (
              filterText ? (
                filteredWorkspace.map((p) => (
                  <FlatPageRow key={p.id} page={p} depth={0} onContextMenu={(x, y) => setContextMenu({ x, y, page: p })} />
                ))
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e: DragStartEvent) => setDraggingId(e.active.id as string)}
                  onDragEnd={handleWorkspaceDragEnd}
                >
                  <SortableContext items={topLevelPageIds} strategy={verticalListSortingStrategy}>
                    {workspacePages.map((page) => (
                      <SortablePageItem
                        key={page.id}
                        page={page}
                        onContextMenu={(x, y) => setContextMenu({ x, y, page })}
                      />
                    ))}
                  </SortableContext>
                  {draggingId && (
                    <DragOverlay dropAnimation={null}>
                      <DragGhost label={workspacePages.find((p) => p.id === draggingId)?.title || 'Page'} />
                    </DragOverlay>
                  )}
                </DndContext>
              )
            )}
            {sections.workspace && workspacePages.length === 0 && !filterText && (
              <div style={{ padding: '6px 14px', fontSize: 12, color: 'var(--text-faint)' }}>No pages yet</div>
            )}

            {/* ── PRIVATE ──────────────────────────────────────────────── */}
            <SectionHeader
              label="Private"
              icon={<Lock size={11} />}
              open={sections.private}
              onToggle={() => toggleSection('private')}
              action={<button className="page-tree-action-btn" onClick={() => { const id = createPage(null); setTimeout(() => useStore.getState().setPagePrivate(id, true), 50); }} title="New private page"><Plus size={12} /></button>}
            />
            {sections.private && (
              privatePages.length === 0
                ? <div style={{ padding: '6px 14px', fontSize: 12, color: 'var(--text-faint)' }}>Right-click any page → "Make private"</div>
                : privatePages.map((p) => (
                    <FlatPageRow key={p.id} page={p} depth={0} onContextMenu={(x, y) => setContextMenu({ x, y, page: p })} />
                  ))
            )}

            {/* ── SHARED ───────────────────────────────────────────────── */}
            {sharedPages.length > 0 && (
              <>
                <SectionHeader label="Shared" icon={<Globe size={11} />} open={sections.shared} onToggle={() => toggleSection('shared')} />
                {sections.shared && sharedPages.map((p) => (
                  <FlatPageRow key={p.id} page={p} depth={0} onContextMenu={(x, y) => setContextMenu({ x, y, page: p })} />
                ))}
              </>
            )}

            {/* ── AI DIGEST ────────────────────────────────────────────── */}
            <SectionHeader label="AI Digest" open={sections.aiDigest} onToggle={() => toggleSection('aiDigest')} />
            {sections.aiDigest && (
              <div className="ai-digest-widget">
                <div className="ai-digest-row" onClick={() => navigate({ type: 'calendar' })}>
                  <span style={{ fontSize: 14 }}>✅</span>
                  <span>{dueTodayCount} task{dueTodayCount !== 1 ? 's' : ''} due today</span>
                </div>
                {recentPages[0] && (
                  <div className="ai-digest-row" onClick={() => navigateToPage(recentPages[0].id)}>
                    <span style={{ fontSize: 14 }}>📝</span>
                    <span>Last: {recentPages[0].title || 'Untitled'}</span>
                  </div>
                )}
                {unreadCount > 0 && (
                  <div className="ai-digest-row" onClick={() => setInboxOpen(true)}>
                    <span style={{ fontSize: 14 }}>🔔</span>
                    <span>{unreadCount} unread update{unreadCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── VAULT ────────────────────────────────────────────────── */}
            {vaultPages.length > 0 && (
              <>
                <SectionHeader label={`Vault (${vaultPages.length})`} open={sections.vault} onToggle={() => toggleSection('vault')} />
                {sections.vault && vaultPages.map((p) => (
                  <FlatPageRow key={p.id} page={p} depth={0} vault onContextMenu={(x, y) => setContextMenu({ x, y, page: p })} />
                ))}
              </>
            )}
          </div>

          {/* Bottom */}
          <div className="sidebar-bottom">
            <button className="sidebar-nav-item" style={{ color: 'var(--accent)', fontWeight: 500 }} onClick={quickCapture}>
              <span className="nav-icon"><Zap size={14} /></span><span>Quick Capture</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => setImportOpen(true)}>
              <span className="nav-icon"><Upload size={14} /></span><span>Import</span>
            </button>
            <button className="sidebar-nav-item" onClick={() => setTrashOpen(true)}>
              <span className="nav-icon"><Trash2 size={14} /></span><span>Trash</span>
            </button>
            <button className="sidebar-new-page-btn" onClick={() => createPage()}>
              <Plus size={14} /><span>New page</span>
            </button>
          </div>
        </div>

        <div className="sidebar-resize" onMouseDown={handleResizeStart} />
      </aside>

      {contextMenu && (
        <PageContextMenuPortal
          page={contextMenu.page}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {trashOpen  && <TrashModal  onClose={() => setTrashOpen(false)} />}
      {inboxOpen  && createPortal(<InboxModal  onClose={() => setInboxOpen(false)} />, document.body)}
      {importOpen && createPortal(<ImportModal onClose={() => setImportOpen(false)} />, document.body)}
    </>
  );
}

// ── Drag ghost shown in DragOverlay ────────────────────────────────────────

function DragGhost({ label }: { label: string }) {
  return (
    <div className="drag-ghost">
      <GripVertical size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
        {label || 'Untitled'}
      </span>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ label, icon, open, onToggle, action }: {
  label: string; icon?: React.ReactNode;
  open: boolean; onToggle: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="sidebar-section-header" onClick={onToggle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-faint)' }}>
        {icon}
        <span>{label}</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
        <ChevronDown size={11} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 180ms ease', color: 'var(--text-faint)' }} />
      </div>
    </div>
  );
}

// ── Flat page row (favorites / recent / private / shared) ──────────────────

function FlatPageRow({ page, depth, showTime, vault, onContextMenu }: {
  page: Page; depth: number; showTime?: boolean; vault?: boolean;
  onContextMenu: (x: number, y: number) => void;
}) {
  const activeView    = useStore((s) => s.activeView);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const isActive = activeView.type === 'page' && activeView.id === page.id;

  return (
    <div
      className={`page-tree-row ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: 12 + depth * 18 }}
      onClick={() => navigateToPage(page.id)}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); }}
      title={`Last edited ${formatDistanceToNow(page.updatedAt, { addSuffix: true })}`}
    >
      <span style={{ width: 20, flexShrink: 0 }} />
      <span className="page-tree-icon" style={{ display: 'flex', alignItems: 'center' }}>
        <NotionIcon icon={page.icon || 'notion_page'} size="13px" />
      </span>
      <span className="page-tree-title">{page.title || 'Untitled'}</span>
      {vault && page.expiresAt && (
        <span style={{ fontSize: 10, color: 'var(--danger)', marginLeft: 'auto', flexShrink: 0 }}>
          {formatDistanceToNow(page.expiresAt, { addSuffix: true })}
        </span>
      )}
      {showTime && !vault && (
        <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatDistanceToNow(page.updatedAt, { addSuffix: true })}
        </span>
      )}
      <PageBadges page={page} />
    </div>
  );
}

// Sortable flat row for favorites
function SortablePageRow(props: { page: Page; depth: number; showTime?: boolean; onContextMenu: (x: number, y: number) => void }) {
  const { page } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
    >
      <div
        className={`page-tree-row ${(() => { const av = useStore.getState().activeView; return av.type === 'page' && (av as { type: 'page'; id: string }).id === page.id; })() ? 'active' : ''}`}
        style={{ paddingLeft: 12 }}
        onClick={() => useStore.getState().navigateToPage(page.id)}
        onContextMenu={(e) => { e.preventDefault(); props.onContextMenu(e.clientX, e.clientY); }}
        title={`Last edited ${formatDistanceToNow(page.updatedAt, { addSuffix: true })}`}
      >
        {/* Visible grip handle */}
        <span
          className="page-tree-grip-handle"
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical size={12} />
        </span>
        <span className="page-tree-icon" style={{ display: 'flex', alignItems: 'center' }}>
          <NotionIcon icon={page.icon || 'notion_page'} size="13px" />
        </span>
        <span className="page-tree-title">{page.title || 'Untitled'}</span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatDistanceToNow(page.updatedAt, { addSuffix: true })}
        </span>
        <PageBadges page={page} />
      </div>
    </div>
  );
}

// ── Page badges ────────────────────────────────────────────────────────────

function PageBadges({ page }: { page: Page }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginLeft: 2 }}>
      {page.isLocked    && <Lock    size={9} style={{ color: 'var(--text-faint)', opacity: 0.7 }} />}
      {page.isPublished && <Globe   size={9} style={{ color: 'var(--accent)',     opacity: 0.7 }} />}
      {page.databaseId  && <Database size={9} style={{ color: 'var(--text-faint)', opacity: 0.7 }} />}
      {page.expiresAt   && <Clock   size={9} style={{ color: 'var(--danger)',     opacity: 0.7 }} />}
    </span>
  );
}

// ── Sortable page item (top-level workspace with nested tree) ──────────────

function SortablePageItem({ page, onContextMenu }: {
  page: Page; onContextMenu: (x: number, y: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
    >
      <PageTreeItem
        page={page}
        depth={0}
        dragListeners={listeners}
        dragAttributes={attributes}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}

// ── Recursive page tree item with nested DnD ──────────────────────────────

interface PageTreeItemProps {
  page: Page;
  depth: number;
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  onContextMenu: (x: number, y: number) => void;
}

function PageTreeItem({ page, depth, dragListeners, dragAttributes, onContextMenu }: PageTreeItemProps) {
  const pages            = useStore((s) => s.pages);
  const activeView       = useStore((s) => s.activeView);
  const navigateToPage   = useStore((s) => s.navigateToPage);
  const createPage       = useStore((s) => s.createPage);
  const toggleExpanded   = useStore((s) => s.toggleExpanded);
  const reorderChildren  = useStore((s) => s.reorderChildren);
  const [draggingChildId, setDraggingChildId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const isActive = activeView.type === 'page' && activeView.id === page.id;
  const children = page.children
    .map((id) => pages.find((p) => p.id === id))
    .filter((p): p is Page => Boolean(p && !p.isDeleted));
  const hasChildren = children.length > 0;
  const paddingLeft = 12 + depth * 18;

  const handleChildDragEnd = (e: DragEndEvent) => {
    setDraggingChildId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = children.map((c) => c.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderChildren(page.id, arrayMove(ids, oldIdx, newIdx));
    }
  };

  return (
    <div className="page-tree-item">
      <div
        className={`page-tree-row ${isActive ? 'active' : ''} ${page.isExpanded ? 'expanded' : ''}`}
        style={{ paddingLeft }}
        onClick={() => navigateToPage(page.id)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); }}
        title={`Last edited ${formatDistanceToNow(page.updatedAt, { addSuffix: true })}`}
      >
        {/* Drag grip — always shown (subtle until hover) */}
        {depth === 0 && dragListeners && (
          <span
            className="page-tree-grip-handle"
            {...dragListeners}
            {...dragAttributes}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <GripVertical size={12} />
          </span>
        )}

        {/* Expand toggle */}
        <button
          className="page-tree-expand"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) toggleExpanded(page.id); }}
          style={{ opacity: hasChildren ? 1 : 0, cursor: hasChildren ? 'pointer' : 'default', flexShrink: 0 }}
          tabIndex={-1}
        >
          <ChevronRight size={12} style={{ transform: page.isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 180ms ease' }} />
        </button>

        <span className="page-tree-icon" style={{ display: 'flex', alignItems: 'center' }}>
          {page.databaseId ? <Database size={12} /> : <NotionIcon icon={page.icon || 'notion_page'} size="13px" />}
        </span>

        <span className="page-tree-title">{page.title || 'Untitled'}</span>
        <PageBadges page={page} />

        <div className="page-tree-actions" onClick={(e) => e.stopPropagation()}>
          <button className="page-tree-action-btn" onClick={(e) => { e.stopPropagation(); onContextMenu(e.clientX, e.clientY); }}>
            <MoreHorizontal size={12} />
          </button>
          <button className="page-tree-action-btn" onClick={() => { createPage(page.id); if (!page.isExpanded) toggleExpanded(page.id); }}>
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Children — with their own DnD context for reordering */}
      <div className={`page-tree-children-wrap ${page.isExpanded && hasChildren ? 'open' : ''}`}>
        <div className="page-tree-children-inner">
          {hasChildren && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setDraggingChildId(e.active.id as string)}
              onDragEnd={handleChildDragEnd}
            >
              <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {children.map((child) => (
                  <SortablePageItem key={child.id} page={child} onContextMenu={onContextMenu} />
                ))}
              </SortableContext>
              {draggingChildId && (
                <DragOverlay dropAnimation={null}>
                  <DragGhost label={children.find((c) => c.id === draggingChildId)?.title || 'Page'} />
                </DragOverlay>
              )}
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Context menu portal ────────────────────────────────────────────────────

function PageContextMenuPortal({ page, x, y, onClose }: {
  page: Page; x: number; y: number; onClose: () => void;
}) {
  const deletePage     = useStore((s) => s.deletePage);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const createPage     = useStore((s) => s.createPage);
  const toggleExpanded = useStore((s) => s.toggleExpanded);
  const setPagePrivate = useStore((s) => s.setPagePrivate);
  const setPageExpiry  = useStore((s) => s.setPageExpiry);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const updatePage     = useStore((s) => s.updatePage);
  const { toast }      = useToast();

  const menuX = Math.min(x, window.innerWidth  - 220);
  const menuY = Math.min(y, window.innerHeight - 320);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={onClose} />
      <div className="dropdown-menu" style={{ position: 'fixed', left: menuX, top: menuY, zIndex: 999 }} onClick={(e) => e.stopPropagation()}>
        <button className="dropdown-item" onClick={() => { navigateToPage(page.id); onClose(); }}>Open page</button>
        {/* Satisfy TS — AppView.id only exists for 'page' type */}
        <button className="dropdown-item" onClick={() => {
          const id = createPage(page.parentId);
          updatePage(id, { title: `${page.title} (copy)`, icon: page.icon, content: page.content });
          toast('Duplicated'); onClose();
        }}>Duplicate</button>
        <button className="dropdown-item" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}#page-${page.id}`); toast('Link copied'); onClose(); }}>Copy link</button>
        <div className="dropdown-sep" />
        <button className="dropdown-item" onClick={() => { toggleFavorite(page.id); toast(page.isFavorite ? 'Removed from Favorites' : 'Added to Favorites'); onClose(); }}>
          {page.isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
        </button>
        <button className="dropdown-item" onClick={() => { setPagePrivate(page.id, !page.isPrivate); toast(page.isPrivate ? 'Moved to Workspace' : 'Moved to Private'); onClose(); }}>
          {page.isPrivate ? <><Eye size={13} /> Make workspace</> : <><EyeOff size={13} /> Make private</>}
        </button>
        <button className="dropdown-item" onClick={() => { createPage(page.id); if (!page.isExpanded) toggleExpanded(page.id); onClose(); }}>
          <Plus size={13} /> Add subpage
        </button>
        <div className="dropdown-sep" />
        <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vault</div>
        <button className="dropdown-item" onClick={() => {
          if (page.expiresAt) { setPageExpiry(page.id, undefined); toast('Expiry removed'); }
          else { setPageExpiry(page.id, Date.now() + 24 * 3600 * 1000); toast('Expires in 24 h'); }
          onClose();
        }}>
          <Clock size={13} /> {page.expiresAt ? 'Remove expiry' : 'Expire in 24 h'}
        </button>
        <div className="dropdown-sep" />
        <div style={{ padding: '4px 10px 2px', fontSize: 11, color: 'var(--text-faint)' }}>
          Last edited {formatDistanceToNow(page.updatedAt, { addSuffix: true })}
        </div>
        <div className="dropdown-sep" />
        <button className="dropdown-item danger" onClick={() => { deletePage(page.id); toast('Moved to trash'); onClose(); }}>
          <Trash2 size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} /> Move to Trash
        </button>
      </div>
    </>
  );
}
