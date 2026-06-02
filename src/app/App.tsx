import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Notes } from './pages/Notes';
import { Vault } from './pages/Vault';
import { Reminders } from './pages/Reminders';
import { Agent } from './pages/Agent';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { CommandMenu } from './components/CommandMenu';
import { api } from './utils/api';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Note } from './types';
import { 
  ShieldAlert, Cloud, WifiOff, RefreshCw, Search, Home, FileText, Lock, 
  Bell, Sparkles, Settings as SettingsIcon, LogOut, Plus, Trash2, Mic, 
  ChevronRight, Menu, X, ArrowLeft
} from 'lucide-react';
import { initialNotesList } from './utils/initialNotes';
import { toast } from 'sonner';
import { clsx } from 'clsx';

// Pre-built default templates
const defaultTemplates = {
  meeting: [
    { id: 'meet-1', type: 'h1', content: 'Product Sync Minutes' },
    { id: 'meet-2', type: 'callout', content: '📅 Date: ' + new Date().toLocaleDateString() + '\n👥 Attendees: Dev Team, Design Lead', properties: { calloutType: 'note' } },
    { id: 'meet-3', type: 'h2', content: 'Agenda Updates' },
    { id: 'meet-4', type: 'bullet', content: 'Finalize custom Google Client ID configuration settings on login panels.' },
    { id: 'meet-5', type: 'bullet', content: 'Revamp mobile navigations with responsive drawer controls.' },
    { id: 'meet-6', type: 'h2', content: 'Action Checklist' },
    { id: 'meet-7', type: 'todo', content: 'Write tests verifying JWT user separation context', properties: { checked: false } },
    { id: 'meet-8', type: 'todo', content: 'Integrate pre-built templates selection widget', properties: { checked: false } }
  ],
  todo: [
    { id: 'list-1', type: 'h1', content: 'Weekly Priorities' },
    { id: 'list-2', type: 'callout', content: 'Protip: Hit "/" inside any block to open the commands popup!', properties: { calloutType: 'info' } },
    { id: 'list-3', type: 'todo', content: 'Implement code block language selection fields', properties: { checked: true } },
    { id: 'list-4', type: 'todo', content: 'Add Drag or reordering buttons for blocks on mobile viewports', properties: { checked: false } },
    { id: 'list-5', type: 'todo', content: 'Optimize asset imports for Capacitor hybrid builds', properties: { checked: false } }
  ],
  journal: [
    { id: 'j-1', type: 'h1', content: 'Daily Log Reflection' },
    { id: 'j-2', type: 'quote', content: '“Simplicity is the ultimate sophistication.” — Leonardo da Vinci' },
    { id: 'j-3', type: 'h2', content: 'What went well today?' },
    { id: 'j-4', type: 'bullet', content: 'Built a modular, highly-interactive React block editor.' },
    { id: 'j-5', type: 'h2', content: 'Gratitude list' },
    { id: 'j-6', type: 'number', content: 'Grateful for clean, beautiful gradients and aesthetic sakura themes.' },
    { id: 'j-7', type: 'number', content: 'Grateful for RAG-based AI tools scheduling items automatically.' }
  ]
};

// Metadata parsing helpers
const parseNoteContent = (content: string): { metadata: { icon?: string; cover?: string; parentId?: string | null; blocks?: any[] }; cleanContent: string } => {
  if (!content) return { metadata: {}, cleanContent: '' };
  const match = content.match(/^<!--\s*metadata:(\{.*?\})\s*-->/);
  if (match) {
    try {
      const metadata = JSON.parse(match[1]);
      const cleanContent = content.slice(match[0].length);
      return { metadata, cleanContent };
    } catch (e) {
      // Fallback
    }
  }
  return { metadata: {}, cleanContent: content };
};

const serializeNoteContent = (cleanContent: string, metadata: any): string => {
  const metadataString = `<!-- metadata:${JSON.stringify(metadata)} -->`;
  return metadataString + cleanContent;
};

// Simple date formatter helper
const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [hasUnsynced, setHasUnsynced] = useState(false);

  // Notes state lifted up - initialized with preloaded template pages
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', initialNotesList);
  const [selectedNoteId, setSelectedNoteId] = useLocalStorage<string | null>('notes-selected-id', null);
  const [collapsedNodes, setCollapsedNodes] = useLocalStorage<Record<string, boolean>>('notes-collapsed-nodes', {});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const checkUnsyncedData = () => {
    try {
      const notesRaw = localStorage.getItem('notes');
      const vaultRaw = localStorage.getItem('vault');
      const remindersRaw = localStorage.getItem('reminders');

      const hasNotes = notesRaw ? JSON.parse(notesRaw).some((n: any) => !n.id.includes('-')) : false;
      const hasVault = vaultRaw ? JSON.parse(vaultRaw).some((v: any) => !v.id.includes('-')) : false;
      const hasRem = remindersRaw ? JSON.parse(remindersRaw).some((r: any) => !r.id.includes('-')) : false;

      return hasNotes || hasVault || hasRem;
    } catch {
      return false;
    }
  };

  const checkConnection = async () => {
    setIsChecking(true);
    const online = await api.checkServer();
    setIsOnline(online);
    
    if (online) {
      const token = api.getToken();
      setIsAuthenticated(!!token);
      if (token) {
        setHasUnsynced(checkUnsyncedData());
      }
    } else {
      setIsAuthenticated(false);
      setHasUnsynced(false);
    }
    setIsChecking(false);
  };

  const handleSync = async () => {
    try {
      const vaultRaw = localStorage.getItem('vault');
      const hasUnsyncedVault = vaultRaw ? JSON.parse(vaultRaw).some((v: any) => !v.id.includes('-')) : false;

      let vaultPassword = '';
      if (hasUnsyncedVault) {
        const pw = prompt('You have unsynced secure vault entries. Please enter your master password to decrypt and sync them. (Leave empty to skip vault items)');
        if (pw) vaultPassword = pw;
      }

      toast.loading('Syncing local data...');
      await api.syncLocalData(vaultPassword);
      toast.dismiss();
      toast.success('Local data successfully synced to the cloud!');
      setHasUnsynced(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.dismiss();
      toast.error('Synchronization failed');
    }
  };

  // Merge preloaded templates if they are missing
  useEffect(() => {
    const hasTemplates = notes.some(n => n.id.startsWith('init-'));
    if (!hasTemplates) {
      setNotes(prev => {
        const filteredPrev = prev.filter(n => !n.id.startsWith('init-'));
        return [...initialNotesList, ...filteredPrev];
      });
    }
  }, [notes, setNotes]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(async () => {
      const online = await api.checkServer();
      setIsOnline(online);
      if (online && api.getToken()) {
        setHasUnsynced(checkUnsyncedData());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener to open Command Menu (Ctrl+K or Ctrl+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'o') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    toast.success('Synced with server');
    checkConnection();
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    checkConnection();
  };

  // Custom page creators
  const handleCreateMeetingNote = async () => {
    const defaultTitle = 'Product Sync Minutes';
    const metadata = { blocks: defaultTemplates.meeting, icon: '🌸', cover: 'linear-gradient(135deg, #ffd1dc 0%, #ff8da1 100%)' };
    const serialized = serializeNoteContent('', metadata);

    if (isOnline && isAuthenticated) {
      try {
        const created = await api.createNote(defaultTitle, serialized);
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        setCurrentPage('notes');
        setIsMobileSidebarOpen(false);
        toast.success('Created AI Meeting Note!');
      } catch {
        toast.error('Failed to create note on cloud');
      }
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: defaultTitle,
        content: serialized,
        aiGenerated: false,
        tags: ['notes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
      setCurrentPage('notes');
      setIsMobileSidebarOpen(false);
      toast.success('Created local AI Meeting Note!');
    }
  };

  const handleCreateBlankNote = async () => {
    const defaultTitle = 'Untitled Page';
    const metadata = { blocks: [{ id: 'b-init', type: 'text', content: '' }] };
    const serialized = serializeNoteContent('', metadata);

    if (isOnline && isAuthenticated) {
      try {
        const created = await api.createNote(defaultTitle, serialized);
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        setCurrentPage('notes');
        setIsMobileSidebarOpen(false);
        toast.success('Created Blank Page!');
      } catch {
        toast.error('Failed to create page on cloud');
      }
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: defaultTitle,
        content: serialized,
        aiGenerated: false,
        tags: ['notes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
      setCurrentPage('notes');
      setIsMobileSidebarOpen(false);
      toast.success('Created local Blank Page!');
    }
  };

  const handleCreateSubNote = async (parentId: string) => {
    const defaultTitle = 'Untitled Sub-page';
    const metadata = { parentId, blocks: [{ id: 'b-sub', type: 'text', content: '' }] };
    const serializedContent = serializeNoteContent('', metadata);

    if (isOnline && isAuthenticated) {
      try {
        const created = await api.createNote(defaultTitle, serializedContent);
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        setCollapsedNodes(prev => ({ ...prev, [parentId]: false }));
        setCurrentPage('notes');
        setIsMobileSidebarOpen(false);
        toast.success('New sub-page created');
      } catch {
        toast.error('Failed to create sub-page on cloud');
      }
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: defaultTitle,
        content: serializedContent,
        aiGenerated: false,
        tags: ['notes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
      setCollapsedNodes(prev => ({ ...prev, [parentId]: false }));
      setCurrentPage('notes');
      setIsMobileSidebarOpen(false);
      toast.success('New local sub-page created');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (isOnline && isAuthenticated) {
      try {
        await api.deleteNote(id);
        // Clear references
        for (const n of notes) {
          const { metadata, cleanContent } = parseNoteContent(n.content);
          if (metadata.parentId === id) {
            const newMetadata = { ...metadata, parentId: null };
            const serialized = serializeNoteContent(cleanContent, newMetadata);
            api.updateNote(n.id, n.title, serialized).catch(() => {});
          }
        }
        const filtered = notes.filter(n => n.id !== id);
        setNotes(filtered);
        if (selectedNoteId === id) {
          setSelectedNoteId(filtered[0]?.id || null);
        }
        toast.success('Page deleted');
      } catch {
        toast.error('Failed to delete page');
      } finally {
        setDeleteConfirmId(null);
      }
    } else {
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      if (selectedNoteId === id) {
        setSelectedNoteId(filtered[0]?.id || null);
      }
      setDeleteConfirmId(null);
      toast.success('Page deleted');
    }
  };

  // Convert note contents to metadata
  const notesWithMetadata = notes.map(note => {
    const { metadata, cleanContent } = parseNoteContent(note.content);
    return { ...note, metadata, cleanContent };
  });

  const toggleNode = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Global Sidebar recursive tree renderer
  const renderSidebarTree = (parentId: string | null, depth = 0) => {
    const levelNotes = notesWithMetadata.filter(n => {
      if (parentId === null) {
        return !n.metadata.parentId || !notes.some(other => other.id === n.metadata.parentId);
      }
      return n.metadata.parentId === parentId;
    });

    if (levelNotes.length === 0) return null;

    return (
      <div className={clsx("space-y-0.5", depth > 0 && "pl-2.5 border-l border-sidebar-border ml-2 mt-0.5")}>
        {levelNotes.map(note => {
          const hasChildren = notesWithMetadata.some(n => n.metadata.parentId === note.id);
          const isCollapsed = !!collapsedNodes[note.id];
          const isActive = currentPage === 'notes' && selectedNoteId === note.id;
          const icon = note.metadata.icon || '';

          return (
            <div key={note.id} className="space-y-0.5">
              <div
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setCurrentPage('notes');
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(false);
                  }
                }}
                className={clsx(
                  "group flex items-center justify-between px-2 py-1 rounded text-sm font-normal cursor-pointer transition-all active:scale-99",
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(note.id);
                      }}
                      className="p-0.5 rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer flex-shrink-0"
                    >
                      <ChevronRight className={clsx("w-3 h-3 transition-transform duration-200", !isCollapsed && "rotate-90")} />
                    </button>
                  ) : (
                    <div className="w-4 flex-shrink-0" />
                  )}

                  <span className="text-sm select-none flex-shrink-0">
                    {icon ? icon : <FileText className="w-3.5 h-3.5 flex-shrink-0 text-sidebar-foreground/50" />}
                  </span>

                  <span className="truncate">{note.title || 'Untitled Page'}</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateSubNote(note.id);
                    }}
                    className="p-0.5 rounded hover:bg-sidebar-accent hover:text-sidebar-foreground text-sidebar-foreground/60 cursor-pointer"
                    title="Add sub-page"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(note.id);
                    }}
                    className="p-0.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {hasChildren && !isCollapsed && renderSidebarTree(note.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'notes':
        return (
          <Notes 
            notes={notes} 
            setNotes={setNotes} 
            selectedNoteId={selectedNoteId} 
            setSelectedNoteId={setSelectedNoteId}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />
        );
      case 'vault':
        return <Vault />;
      case 'reminders':
        return <Reminders />;
      case 'agent':
        return <Agent />;
      case 'settings':
        return <Settings onLogout={handleLogout} />;
      default:
        return <Dashboard />;
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Checking server status...</p>
        </div>
      </div>
    );
  }

  if (isOnline && !isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Sidebar Layout Fragment
  const sidebarContent = (
    <>
      {/* Profile Header */}
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pl-1">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white shadow-sm flex-shrink-0 select-none">
            V
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground truncate">Vishnu M's Notion</span>
        </div>

        {/* Global Connection Badge */}
        {isOnline && isAuthenticated ? (
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" title="Connected to Cloud Server" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-500 mr-1" title="Offline Mode" />
        )}
      </div>

      {/* Navigation Icons Row */}
      <div className="px-3 py-2 border-b border-sidebar-border grid grid-cols-5 gap-1 flex-shrink-0 bg-sidebar">
        <button 
          onClick={() => { setCurrentPage('dashboard'); setIsMobileSidebarOpen(false); }}
          className={clsx(
            "p-1.5 rounded flex items-center justify-center transition-all cursor-pointer",
            currentPage === 'dashboard' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
          title="Home (Dashboard)"
        >
          <Home className="w-4 h-4" />
        </button>
        <button 
          onClick={() => { setCurrentPage('agent'); setIsMobileSidebarOpen(false); }}
          className={clsx(
            "p-1.5 rounded flex items-center justify-center transition-all cursor-pointer",
            currentPage === 'agent' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
          title="AI Agent Chat"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button 
          onClick={handleCreateMeetingNote}
          className="p-1.5 rounded flex items-center justify-center text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all cursor-pointer"
          title="New AI Meeting Note"
        >
          <Mic className="w-4 h-4" />
        </button>
        <button 
          onClick={() => { setCurrentPage('reminders'); setIsMobileSidebarOpen(false); }}
          className={clsx(
            "p-1.5 rounded flex items-center justify-center transition-all cursor-pointer",
            currentPage === 'reminders' ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
          title="Inbox/Reminders"
        >
          <Bell className="w-4 h-4" />
        </button>
        <button 
          onClick={() => { setShowCommandMenu(true); setIsMobileSidebarOpen(false); }}
          className="p-1.5 rounded flex items-center justify-center text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all cursor-pointer"
          title="Command Search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Meetings Card Widget */}
      <div className="p-3 border-b border-sidebar-border space-y-2 flex-shrink-0 bg-sidebar">
        <div className="flex items-center gap-1.5 select-none pl-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">Meetings</span>
        </div>
        <div 
          onClick={() => toast.success('Calendar integration wizard started!')}
          className="p-2.5 rounded border border-sidebar-border bg-card hover:bg-sidebar-accent/30 transition-all cursor-pointer space-y-1 hover:scale-[1.01]"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-sidebar-foreground">Connect your calendar</span>
          </div>
          <p className="text-[10px] text-sidebar-foreground/60 leading-relaxed">
            See all your events and start meeting notes for them.
          </p>
        </div>
        <button
          onClick={handleCreateMeetingNote}
          className="w-full py-1.5 px-3 rounded bg-sidebar-accent hover:bg-sidebar-accent/80 text-[10px] font-bold text-sidebar-foreground border border-sidebar-border transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
        >
          <Mic className="w-3.5 h-3.5 text-primary" />
          New AI meeting note
        </button>
      </div>

      <div className="p-3 border-b border-sidebar-border space-y-1.5 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 block select-none pl-2">Recents</span>
        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
          {notesWithMetadata.slice(0, 8).map(n => {
            const isActive = currentPage === 'notes' && selectedNoteId === n.id;
            return (
              <div
                key={n.id}
                onClick={() => { setSelectedNoteId(n.id); setCurrentPage('notes'); setIsMobileSidebarOpen(false); }}
                className={clsx(
                  "flex flex-col gap-0.5 px-2 py-1 rounded cursor-pointer transition-all active:scale-99",
                  isActive ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <div className="flex items-center gap-2 text-sm font-normal">
                  <span className="text-sm select-none flex-shrink-0">{n.metadata.icon || '📄'}</span>
                  <span className="truncate">{n.title || 'Untitled Page'}</span>
                </div>
                <span className="text-[10px] text-sidebar-foreground/50 pl-6 select-none font-normal">
                  {formatDate(n.updatedAt)}
                </span>
              </div>
            );
          })}
          {notes.length === 0 && (
            <span className="text-[10px] text-sidebar-foreground/50 italic pl-2.5 block">No recent pages</span>
          )}
        </div>
      </div>

      {/* Agents Builder Widget */}
      <div className="p-3 border-b border-sidebar-border space-y-1.5 flex-shrink-0 bg-sidebar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 block select-none pl-2">Agents</span>
        <button
          onClick={() => { setCurrentPage('agent'); setIsMobileSidebarOpen(false); toast.success('Agent customization tool initialized.'); }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar-accent/50 text-xs font-normal text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer transition-all border border-dashed border-sidebar-border text-left"
        >
          <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>New agent</span>
        </button>
      </div>

      {/* Private Pages Collapsible Hierarchical Tree */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1.5 bg-sidebar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 block select-none pl-2">Private</span>
        {notes.length === 0 ? (
          <span className="text-[10px] text-sidebar-foreground/50 italic pl-2.5 block">No pages created yet</span>
        ) : (
          renderSidebarTree(null)
        )}
      </div>

      {/* Footer controls */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar flex items-center justify-between flex-shrink-0 gap-3">
        <button
          onClick={() => { setCurrentPage('agent'); setIsMobileSidebarOpen(false); }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-sidebar-accent text-[10px] font-bold text-sidebar-foreground/70 hover:text-sidebar-foreground border border-sidebar-border transition-all cursor-pointer hover:scale-[1.01]"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>New chat</span>
          <kbd className="text-[9px] text-sidebar-foreground/50 border border-sidebar-border px-1 rounded bg-card select-none">Ctrl+O</kbd>
        </button>
        
        {/* Settings, Vault links & Logout */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setCurrentPage('settings'); setIsMobileSidebarOpen(false); }}
            className={clsx(
              "p-1.5 rounded transition-colors cursor-pointer",
              currentPage === 'settings' ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrentPage('vault'); setIsMobileSidebarOpen(false); }}
            className={clsx(
              "p-1.5 rounded transition-colors cursor-pointer",
              currentPage === 'vault' ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
            title="Secure Vault"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex text-foreground overflow-hidden">
      
      {/* Desktop Persistent Left Sidebar (Notion-style) */}
      <div 
        className={clsx(
          "hidden lg:flex flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen overflow-hidden",
          isSidebarCollapsed ? "w-0 border-r-0" : "w-[280px]"
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile Drawer Slide-out Left Sidebar */}
      {isMobileSidebarOpen && (
        <>
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
          />
          <div className="fixed inset-y-0 left-0 w-[290px] bg-sidebar border-r border-sidebar-border shadow-2xl z-50 flex flex-col lg:hidden animate-in slide-in-left duration-200">
            {sidebarContent}
          </div>
        </>
      )}

      {/* Right Page Content Panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
        
        {/* Mobile top bar to toggle drawer */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border/10 bg-card/65 backdrop-blur-md flex-shrink-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-secondary/80 text-muted-foreground"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <span className="font-extrabold text-sm text-foreground">Sanctum</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick command search icon */}
            <button
              onClick={() => setShowCommandMenu(true)}
              className="p-2 rounded-xl bg-secondary/80 text-muted-foreground"
            >
              <Search className="w-4 h-4" />
            </button>

            {hasUnsynced && isOnline && isAuthenticated && (
              <button 
                onClick={handleSync}
                className="p-2 rounded-xl bg-primary text-white animate-pulse"
                title="Sync offline edits"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Workspace content page view */}
        <main className="flex-1 overflow-hidden relative">
          {renderPage()}
        </main>
      </div>

      {/* Global Command Menu Dialog overlay */}
      <CommandMenu 
        isOpen={showCommandMenu} 
        onClose={() => setShowCommandMenu(false)} 
        onNavigate={(page) => { setCurrentPage(page); setIsMobileSidebarOpen(false); }} 
        onLogout={isAuthenticated ? handleLogout : undefined} 
      />

      {/* Confirm deletion modal */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteNote(deleteConfirmId)}
        title="Delete Page"
        description="Are you sure you want to delete this page? This action cannot be undone and will orphan any nested sub-pages."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider />
      <AppContent />
    </ThemeProvider>
  );
}