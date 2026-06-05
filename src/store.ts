import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  Page, Database, Workspace, UserProfile, AppSettings,
  AppView, SettingsSection, DatabaseCellValue, InboxItem, PageSnapshot,
  VaultEntry, EncryptedVaultEntry, VaultMeta, Reminder, AgentLog, VaultCategory,
} from './types';
import {
  deriveKey, generateSalt, makeVerifier, checkVerifier,
  encryptString, decryptString,
} from './utils/vaultCrypto';
import { api } from './utils/api';
import coverMountains from './assets/notion/cover_mountains.png';

/**
 * Helper to check if an ID is a valid standard UUID.
 * Synced server notes/pages have standard UUIDs, whereas local/simulated pages have nanoid IDs.
 */
const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

let vaultKey: CryptoKey | null = null;

/**
 * Store active debounce timers for page updates.
 */
const updateTimers: Record<string, any> = {};

// ── Serialization / Deserialization helpers ─────────────────────────────────

interface SerializedPage {
  icon?: string;
  cover?: any;
  editorContent?: unknown;
  parentId?: string | null;
  children?: string[];
  isExpanded?: boolean;
  isFavorite?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  isPublished?: boolean;
  isLocked?: boolean;
  isPrivate?: boolean;
  font?: 'default' | 'serif' | 'mono';
  isFullWidth?: boolean;
  isSmallText?: boolean;
  databaseId?: string;
  expiresAt?: number;
  snapshots?: PageSnapshot[];
  tags?: string[];
  aiSummary?: string;
  position?: number;
  favoritePosition?: number;
  database?: Database; // Nested database schema + rows if this page is a database view
}

function serializePageContent(page: Page, database?: Database): string {
  const data: SerializedPage = {
    icon: page.icon,
    cover: page.cover,
    editorContent: page.content,
    parentId: page.parentId,
    children: page.children,
    isExpanded: page.isExpanded,
    isFavorite: page.isFavorite,
    isDeleted: page.isDeleted,
    deletedAt: page.deletedAt,
    isPublished: page.isPublished,
    isLocked: page.isLocked,
    isPrivate: page.isPrivate,
    font: page.font,
    isFullWidth: page.isFullWidth,
    isSmallText: page.isSmallText,
    databaseId: page.databaseId,
    expiresAt: page.expiresAt,
    snapshots: page.snapshots,
    tags: page.tags,
    aiSummary: page.aiSummary,
    position: page.position,
    favoritePosition: page.favoritePosition,
    database: database,
  };
  return JSON.stringify(data);
}

function deserializePageContent(
  backendId: string,
  backendTitle: string,
  backendContent: string,
  backendTags?: string[],
  backendAiSummary?: string,
  backendCreatedAt?: number,
  backendUpdatedAt?: number
): { page: Page; database?: Database } {
  const defaultPage = (contentVal: any): Page => ({
    id: backendId,
    title: backendTitle || '',
    icon: '📄',
    content: contentVal,
    parentId: null,
    children: [],
    isExpanded: false,
    isFavorite: false,
    isDeleted: false,
    isPublished: false,
    isLocked: false,
    isPrivate: false,
    font: 'default',
    isFullWidth: false,
    isSmallText: false,
    createdAt: backendCreatedAt || Date.now(),
    updatedAt: backendUpdatedAt || Date.now(),
    tags: backendTags || [],
    aiSummary: backendAiSummary || '',
  });

  if (!backendContent) {
    return { page: defaultPage(null) };
  }

  try {
    const data = JSON.parse(backendContent) as SerializedPage;
    if (data && (data.editorContent !== undefined || data.parentId !== undefined || data.database !== undefined)) {
      const page: Page = {
        id: backendId,
        title: backendTitle || '',
        icon: data.icon ?? '📄',
        cover: data.cover,
        content: data.editorContent ?? null,
        parentId: data.parentId ?? null,
        children: data.children ?? [],
        isExpanded: !!data.isExpanded,
        isFavorite: !!data.isFavorite,
        isDeleted: !!data.isDeleted,
        deletedAt: data.deletedAt,
        isPublished: !!data.isPublished,
        isLocked: !!data.isLocked,
        isPrivate: !!data.isPrivate,
        font: data.font ?? 'default',
        isFullWidth: !!data.isFullWidth,
        isSmallText: !!data.isSmallText,
        databaseId: data.databaseId,
        expiresAt: data.expiresAt,
        snapshots: data.snapshots,
        tags: data.tags ?? backendTags ?? [],
        aiSummary: data.aiSummary ?? backendAiSummary ?? '',
        position: data.position,
        favoritePosition: data.favoritePosition,
        createdAt: backendCreatedAt || Date.now(),
        updatedAt: backendUpdatedAt || Date.now(),
      };
      return { page, database: data.database };
    }
  } catch (e) {
    // raw fallback
  }

  // Raw text fallback in case of legacy notes
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: backendContent }]
      }
    ]
  };
  return { page: defaultPage(doc) };
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

function makePage(overrides: Partial<Page> & { id?: string }): Page {
  return {
    id: overrides.id ?? nanoid(),
    title: '',
    icon: '📄',
    content: null,
    parentId: null,
    children: [],
    isExpanded: false,
    isFavorite: false,
    isDeleted: false,
    isPublished: false,
    isLocked: false,
    isPrivate: false,
    font: 'default',
    isFullWidth: false,
    isSmallText: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeDatabase(overrides: Partial<Database> & Pick<Database, 'title' | 'properties' | 'rows'>): Database {
  const tableViewId = nanoid();
  return {
    id: overrides.id ?? nanoid(),
    icon: '🗄️',
    views: [
      { id: tableViewId, name: 'Table', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Board', type: 'board', groupByPropertyId: undefined, sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'Gallery', type: 'gallery', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: nanoid(), name: 'List', type: 'list', sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    activeViewId: tableViewId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function row(values: Record<string, DatabaseCellValue>, order: number): Database['rows'][0] {
  return { id: nanoid(), values, order };
}

function buildSeedData() {
  const gettingStartedId = nanoid();
  const quickStartId = nanoid();
  const shortcutsId = nanoid();
  const projectsId = nanoid();
  const websiteId = nanoid();
  const marketingId = nanoid();
  const personalId = nanoid();
  const readingId = nanoid();
  const goalsId = nanoid();

  const taskDbId = nanoid();
  const bookDbId = nanoid();

  const taskStatusPropId = nanoid();
  const taskPriorityPropId = nanoid();
  const taskDuePropId = nanoid();
  const taskAssigneePropId = nanoid();
  const taskTagsPropId = nanoid();
  const taskProgressPropId = nanoid();

  const bookAuthorPropId = nanoid();
  const bookGenrePropId = nanoid();
  const bookRatingPropId = nanoid();
  const bookReadPropId = nanoid();
  const bookNotesPropId = nanoid();

  const gettingStartedContent = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Welcome to Notebook 2.0 👋' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Your all-in-one workspace for notes, tasks, and databases. Explore the sidebar or create a new page to get started.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Key features' }] },
      {
        type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich text editor with slash commands (type /)' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested pages and page hierarchy' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Databases: Table, Board, Gallery, List views' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dark mode with system preference detection' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quick search with Cmd+K' }] }] },
        ],
      },
    ],
  };

  const pages: Page[] = [
    makePage({
      id: gettingStartedId,
      title: 'Getting Started',
      icon: '👋',
      cover: { type: 'url', value: coverMountains, position: 50 },
      content: gettingStartedContent,
      isFavorite: true,
      isExpanded: true,
      children: [quickStartId, shortcutsId],
    }),
    makePage({
      id: quickStartId,
      title: 'Quick Start Guide',
      icon: '🚀',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', position: 50 },
      parentId: gettingStartedId,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quick Start Guide' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Start writing anywhere on the page. Use the slash (/) command to insert blocks.' }] },
        ],
      },
    }),
    makePage({
      id: shortcutsId,
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', position: 50 },
      parentId: gettingStartedId,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Keyboard Shortcuts' }] },
        ],
      },
    }),
    makePage({
      id: projectsId,
      title: 'My Projects',
      icon: '📁',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', position: 50 },
      isExpanded: true,
      children: [websiteId, marketingId],
    }),
    makePage({
      id: websiteId,
      title: 'Website Redesign',
      icon: '🌐',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', position: 50 },
      parentId: projectsId,
      databaseId: taskDbId,
    }),
    makePage({
      id: marketingId,
      title: 'Marketing Campaign',
      icon: '📣',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', position: 50 },
      parentId: projectsId,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Q1 Marketing Campaign' }] },
        ],
      },
    }),
    makePage({
      id: personalId,
      title: 'Personal',
      icon: '🏠',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', position: 50 },
      isExpanded: true,
      children: [readingId, goalsId],
    }),
    makePage({
      id: readingId,
      title: 'Reading List',
      icon: '📚',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', position: 50 },
      parentId: personalId,
      databaseId: bookDbId,
    }),
    makePage({
      id: goalsId,
      title: 'Goals 2025',
      icon: '🎯',
      cover: { type: 'gradient', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', position: 50 },
      parentId: personalId,
      isFavorite: true,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2025 Goals' }] },
        ],
      },
    }),
  ];

  const taskBoardViewId = nanoid();
  const taskDb = makeDatabase({
    id: taskDbId,
    title: 'Project Tasks',
    icon: '✅',
    views: [
      { id: nanoid(), name: 'All Tasks', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: taskBoardViewId, name: 'By Status', type: 'board', groupByPropertyId: taskStatusPropId, sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    properties: [
      { id: 'title', name: 'Name', type: 'title', width: 260, hidden: false },
      {
        id: taskStatusPropId, name: 'Status', type: 'select', width: 130, hidden: false,
        options: [
          { id: nanoid(), name: 'Not Started', color: 'gray' },
          { id: nanoid(), name: 'In Progress', color: 'blue' },
          { id: nanoid(), name: 'Done', color: 'green' },
        ],
      },
      { id: taskDuePropId, name: 'Due Date', type: 'date', width: 130, hidden: false },
    ],
    rows: [
      row({ title: 'Redesign homepage', [taskStatusPropId]: 'In Progress', [taskDuePropId]: '2026-06-15' }, 0),
      row({ title: 'Fix login bug', [taskStatusPropId]: 'Done', [taskDuePropId]: '2026-06-03' }, 1),
    ],
  });

  const bookGalleryViewId = nanoid();
  const bookDb = makeDatabase({
    id: bookDbId,
    title: 'Book Collection',
    icon: '📚',
    views: [
      { id: nanoid(), name: 'Table', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] },
      { id: bookGalleryViewId, name: 'Gallery', type: 'gallery', sorts: [], filters: [], hiddenPropertyIds: [] },
    ],
    properties: [
      { id: 'title', name: 'Title', type: 'title', width: 240, hidden: false },
      { id: bookAuthorPropId, name: 'Author', type: 'text', width: 180, hidden: false },
      {
        id: bookGenrePropId, name: 'Genre', type: 'select', width: 120, hidden: false,
        options: [
          { id: nanoid(), name: 'Technical', color: 'blue' },
          { id: nanoid(), name: 'Non-fiction', color: 'green' },
        ],
      },
    ],
    rows: [
      row({ title: 'The Pragmatic Programmer', [bookAuthorPropId]: 'David Thomas, Andrew Hunt', [bookGenrePropId]: 'Technical' }, 0),
    ],
  });

  return {
    pages,
    databases: [taskDb, bookDb],
    topLevelPageIds: [gettingStartedId, projectsId, personalId],
  };
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface StoreState {
  pages: Page[];
  databases: Database[];
  topLevelPageIds: string[];
  workspace: Workspace;
  user: UserProfile;
  settings: AppSettings;
  activeView: AppView;
  viewHistory: AppView[];
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  searchOpen: boolean;
  zenMode: boolean;
  shortcutsOpen: boolean;
  aiKey: string;
  visitHistory: string[];
  inboxItems: InboxItem[];
  inboxOpen: boolean;

  vaultMeta: VaultMeta;
  vaultEncrypted: EncryptedVaultEntry[];
  vaultUnlocked: boolean;
  vaultEntries: VaultEntry[];

  isAuthenticated: boolean;
  savingPages: Record<string, 'saving' | 'saved' | 'error'>;

  // Backend Integration
  syncWithBackend: () => Promise<void>;
  isServerOnline: boolean;
  setIsServerOnline: (online: boolean) => void;

  // Page actions
  createPage: (parentId?: string | null) => string;
  updatePage: (id: string, patch: Partial<Omit<Page, 'id'>>) => void;
  deletePage: (id: string) => void;
  restorePage: (id: string) => void;
  permanentlyDeletePage: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleExpanded: (id: string) => void;
  movePage: (id: string, newParentId: string | null, afterId?: string) => void;

  // Navigation
  navigate: (view: AppView) => void;
  navigateToPage: (id: string) => void;
  navigateToSettings: (section?: SettingsSection) => void;
  goBack: () => void;

  // Database actions
  updateDatabase: (id: string, patch: Partial<Omit<Database, 'id'>>) => void;
  addDatabaseRow: (databaseId: string, values?: Record<string, DatabaseCellValue>) => string;
  updateDatabaseRow: (databaseId: string, rowId: string, values: Record<string, DatabaseCellValue>) => void;
  deleteDatabaseRow: (databaseId: string, rowId: string) => void;
  setDatabaseView: (databaseId: string, viewId: string) => void;
  moveBoardRow: (databaseId: string, rowId: string, newGroupValue: string, groupPropertyId: string) => void;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateWorkspace: (patch: Partial<Workspace>) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  setSearchOpen: (open: boolean) => void;
  toggleZenMode: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setAiKey: (key: string) => void;
  logVisit: (id: string) => void;
  reorderTopLevelPages: (newOrder: string[]) => void;
  reorderChildren: (parentId: string, newOrder: string[]) => void;
  reorderFavorites: (newOrder: string[]) => void;
  favoriteOrder: string[];
  setPagePrivate: (id: string, isPrivate: boolean) => void;
  setPageExpiry: (id: string, expiresAt?: number) => void;
  saveSnapshot: (id: string, wordCount: number) => void;
  setPageTags: (id: string, tags: string[]) => void;
  setPageAiSummary: (id: string, summary: string) => void;
  getDailyNoteId: () => string;
  setInboxOpen: (open: boolean) => void;
  markInboxRead: () => void;

  // Vault actions
  setupVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  resetVault: () => void;
  addVaultEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVaultEntry: (id: string, patch: Partial<Omit<VaultEntry, 'id' | 'createdAt'>>) => Promise<void>;
  deleteVaultEntry: (id: string) => void;
  setVaultAutoLock: (minutes: number) => void;

  // Auth actions
  signIn: (profile?: Partial<UserProfile>, idToken?: string) => Promise<void>;
  emailLogin: (email: string, password: string) => Promise<{ otpRequired?: boolean; email?: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  emailRegister: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;

  // Database view filters/sorts
  updateDatabaseViewFilters: (databaseId: string, viewId: string, filters: import('./types').DatabaseFilterConfig[]) => void;
  updateDatabaseViewSorts: (databaseId: string, viewId: string, sorts: import('./types').DatabaseSortConfig[]) => void;

  _loadSeed: (data: ReturnType<typeof buildSeedData>) => void;
  _syncPageToBackend: (id: string) => void;

  // Selectors
  getPage: (id: string) => Page | undefined;
  getDatabase: (id: string) => Database | undefined;
  getPagePath: (id: string) => Page[];
  getChildPages: (parentId: string | null) => Page[];
  getFavoritePages: () => Page[];
  getDeletedPages: () => Page[];
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      pages: [],
      databases: [],
      topLevelPageIds: [],
      workspace: {
        id: nanoid(),
        name: 'My Workspace',
        icon: '🏢',
        plan: 'free',
      },
      user: {
        id: nanoid(),
        name: 'You',
        email: 'you@example.com',
        avatar: '🧑',
        color: '#2383e2',
      },
      settings: {
        theme: 'light',
        density: 'default',
        typewriterMode: false,
      },
      activeView: { type: 'home' },
      viewHistory: [],
      sidebarCollapsed: false,
      sidebarWidth: 240,
      searchOpen: false,
      zenMode: false,
      shortcutsOpen: false,
      aiKey: '',
      visitHistory: [],
      inboxItems: [],
      inboxOpen: false,
      favoriteOrder: [],

      vaultMeta: { initialized: false, salt: '', verifier: '', autoLockMinutes: 5 },
      vaultEncrypted: [],
      vaultUnlocked: false,
      vaultEntries: [],

      isAuthenticated: api.getToken() !== null,
      savingPages: {},
      isServerOnline: false,

      setIsServerOnline: (online) => set({ isServerOnline: online }),

      _syncPageToBackend: (id) => {
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          set((s) => ({ savingPages: { ...s.savingPages, [id]: 'saving' } }));
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .then(() => {
              set((s) => ({ savingPages: { ...s.savingPages, [id]: 'saved' } }));
            })
            .catch((err) => {
              console.error(`Failed to sync page ${id} to backend`, err);
              set((s) => ({ savingPages: { ...s.savingPages, [id]: 'error' } }));
            });
        }
      },

      // Helper to replace temporary page IDs seamlessly once saved on backend
      _replacePageId: (tempId: string, realId: string) => {
        let parentToSync: string | null = null;
        set((s) => {
          const pages = s.pages.map((p) => {
            let children = p.children;
            if (children.includes(tempId)) {
              children = children.map((c) => (c === tempId ? realId : c));
              parentToSync = p.id;
            }
            let parentId = p.parentId;
            if (p.parentId === tempId) {
              parentId = realId;
            }
            if (p.id === tempId) {
              return { ...p, id: realId, parentId };
            }
            return { ...p, parentId, children };
          });

          const topLevelPageIds = s.topLevelPageIds.map((id) => (id === tempId ? realId : id));
          
          let activeView = s.activeView;
          if (activeView.type === 'page' && activeView.id === tempId) {
            activeView = { ...activeView, id: realId };
          }

          const visitHistory = s.visitHistory.map((id) => (id === tempId ? realId : id));
          const favoriteOrder = s.favoriteOrder.map((id) => (id === tempId ? realId : id));

          return { pages, topLevelPageIds, activeView, visitHistory, favoriteOrder };
        });
        if (parentToSync && isUuid(parentToSync)) {
          get()._syncPageToBackend(parentToSync);
        }
        if (realId && isUuid(realId)) {
          get()._syncPageToBackend(realId);
        }
      },

      // Sync data with REST endpoints
      syncWithBackend: async () => {
        if (!api.getToken()) return;
        try {
          const online = await api.checkServer();
          set({ isServerOnline: online });
          if (!online) {
            console.warn('Backend server is offline. Skipping backend sync.');
            return;
          }

          // 1. Upload unsynced local pages first (meaning they have temporary non-UUID IDs)
          const unsyncedPages = get().pages.filter((p) => !isUuid(p.id));
          if (unsyncedPages.length > 0) {
            for (const localPageSnapshot of unsyncedPages) {
              try {
                const localPage = get().pages.find(p => p.id === localPageSnapshot.id);
                if (!localPage) continue;
                const matchedDb = localPage.databaseId ? get().databases.find((db) => db.id === localPage.databaseId) : undefined;
                const contentStr = serializePageContent(localPage, matchedDb);
                const created = await api.createNote(localPage.title || 'Untitled Page', contentStr);
                
                // Replace the temporary ID in the local state with the backend-assigned UUID
                get()._replacePageId(localPage.id, created.id);
              } catch (err) {
                console.error(`Failed to upload local page "${localPageSnapshot.title}" to backend:`, err);
              }
            }
          }

          // 2. Fetch the latest list from the backend
          let serverNotes: Note[] = [];
          try {
            serverNotes = await api.getNotes();
          } catch (err: any) {
            if (err.message === 'UNAUTHORIZED') {
              console.warn('Backend rejected session token with 401. Logging out.');
              get().signOut();
              return;
            }
            throw err;
          }
          const parsedPages: Page[] = [];
          const parsedDatabases: Database[] = [];

          if (serverNotes.length === 0) {
            // Start with a clean workspace (no seed/dummy data)
            set({
              pages: [],
              databases: [],
              topLevelPageIds: [],
              activeView: { type: 'home' },
            });
            return;
          }

          for (const note of serverNotes) {
            const createdAtNum = note.createdAt ? new Date(note.createdAt).getTime() : Date.now();
            const updatedAtNum = note.updatedAt ? new Date(note.updatedAt).getTime() : Date.now();
            const { page, database } = deserializePageContent(
              note.id,
              note.title,
              note.content,
              note.tags,
              note.aiSummary,
              createdAtNum,
              updatedAtNum
            );
            parsedPages.push(page);
            if (database) {
              parsedDatabases.push(database);
            }
          }

          const currentPages = get().pages;
          const currentSaving = get().savingPages || {};
          const mergedPages: Page[] = [];

          // 1. Process server pages
          for (const serverPage of parsedPages) {
            const localPage = currentPages.find((p) => p.id === serverPage.id);
            if (localPage) {
              const isDirty = updateTimers[serverPage.id] !== undefined || currentSaving[serverPage.id] === 'saving';
              if (isDirty) {
                mergedPages.push(localPage);
              } else {
                mergedPages.push(serverPage);
              }
            } else {
              mergedPages.push(serverPage);
            }
          }

          // 2. Preserve any local pages that are NOT on the server yet (e.g. temporary IDs or unsaved creations)
          for (const localPage of currentPages) {
            const onServer = parsedPages.some((sp) => sp.id === localPage.id);
            if (!onServer) {
              const isTemp = !isUuid(localPage.id);
              const isDirty = updateTimers[localPage.id] !== undefined || currentSaving[localPage.id] === 'saving';
              if (isTemp || isDirty) {
                mergedPages.push(localPage);
              }
            }
          }

          // Merge databases based on whether their host pages are dirty
          const currentDatabases = get().databases;
          const mergedDatabases: Database[] = [];

          for (const serverDb of parsedDatabases) {
            const hostPageId = mergedPages.find(p => p.databaseId === serverDb.id)?.id;
            const isPageDirty = hostPageId ? (updateTimers[hostPageId] !== undefined || currentSaving[hostPageId] === 'saving') : false;
            if (isPageDirty) {
              const localDb = currentDatabases.find(d => d.id === serverDb.id);
              if (localDb) mergedDatabases.push(localDb);
              else mergedDatabases.push(serverDb);
            } else {
              mergedDatabases.push(serverDb);
            }
          }

          for (const localDb of currentDatabases) {
            const onServer = parsedDatabases.some(sd => sd.id === localDb.id);
            if (!onServer) {
              const hostPageId = mergedPages.find(p => p.databaseId === localDb.id)?.id;
              const isPageDirty = hostPageId ? (updateTimers[hostPageId] !== undefined || currentSaving[hostPageId] === 'saving') : false;
              const isTemp = hostPageId ? !isUuid(hostPageId) : true;
              if (isTemp || isPageDirty) {
                mergedDatabases.push(localDb);
              }
            }
          }

          const topLevelPageIds = mergedPages
            .filter((p) => !p.parentId && !p.isDeleted)
            .sort((a, b) => {
              const posA = a.position ?? 0;
              const posB = b.position ?? 0;
              if (posA !== posB) return posA - posB;
              return b.createdAt - a.createdAt;
            })
            .map((p) => p.id);

          const favoriteOrder = mergedPages
            .filter((p) => p.isFavorite && !p.isDeleted)
            .sort((a, b) => {
              const posA = a.favoritePosition ?? 0;
              const posB = b.favoritePosition ?? 0;
              if (posA !== posB) return posA - posB;
              return b.createdAt - a.createdAt;
            })
            .map((p) => p.id);

          set({ pages: mergedPages, databases: mergedDatabases, topLevelPageIds, favoriteOrder });

          // Sync reminders
          try {
            const backendReminders = await api.getReminders();
            const inboxItems: InboxItem[] = backendReminders.map((r) => ({
              id: r.id,
              type: r.aiGenerated ? 'reminder' : 'reminder',
              title: r.title,
              pageId: r.noteId || undefined,
              time: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
              read: r.fired,
            }));
            set({ inboxItems });
          } catch (e) {
            console.error('Failed to sync reminders:', e);
          }

          // Sync vault if unlocked
          if (get().vaultUnlocked && vaultKey) {
            try {
              const backendVault = await api.getVaultEntries();
              const vaultEntries: VaultEntry[] = [];
              const vaultEncrypted: EncryptedVaultEntry[] = [];

              for (const v of backendVault) {
                try {
                  const decryptedJson = await decryptString(v.value, vaultKey);
                  const entry = JSON.parse(decryptedJson) as VaultEntry;
                  entry.id = v.id;
                  vaultEntries.push(entry);
                  vaultEncrypted.push({
                    id: v.id,
                    blob: v.value,
                    createdAt: v.createdAt ? new Date(v.createdAt).getTime() : Date.now(),
                    updatedAt: v.createdAt ? new Date(v.createdAt).getTime() : Date.now(),
                  });
                } catch { /* decrypt fail */ }
              }
              vaultEntries.sort((a, b) => b.updatedAt - a.updatedAt);
              set({ vaultEntries, vaultEncrypted });
            } catch (e) {
              console.error('Failed to fetch vault items:', e);
            }
          }

        } catch (e) {
          console.error('Failed to sync with backend:', e);
          const online = await api.checkServer();
          set({ isServerOnline: online });
        }
      },

      // ── Page actions ─────────────────────────────────────────────────────

      createPage: (parentId = null) => {
        const id = nanoid(); // temporary local ID
        const page: Page = {
          id,
          title: '',
          icon: '📄',
          content: null,
          parentId,
          children: [],
          isExpanded: false,
          isFavorite: false,
          isDeleted: false,
          isPublished: false,
          isLocked: false,
          isPrivate: false,
          font: 'default',
          isFullWidth: false,
          isSmallText: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((s) => {
          const newPages = [...s.pages, page];
          let newTopLevel = s.topLevelPageIds;
          let updatedPages = newPages;
          if (parentId) {
            updatedPages = newPages.map((p) =>
              p.id === parentId
                ? { ...p, children: [...p.children, id], isExpanded: true }
                : p
            );
          } else {
            newTopLevel = [id, ...s.topLevelPageIds];
          }
          return { pages: updatedPages, topLevelPageIds: newTopLevel };
        });

        // Trigger optimistic backend note creation
        if (api.getToken()) {
          const contentStr = serializePageContent(page);
          api.createNote('Untitled Page', contentStr)
            .then((created) => {
              get()._replacePageId(id, created.id);
            })
            .catch((err) => console.error('Failed to sync new page to backend', err));
        }

        get().navigate({ type: 'page', id });
        return id;
      },

      updatePage: (id, patch) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
          ),
        }));

        const isContentEdit = 'content' in patch || 'title' in patch;

        if (api.getToken() && isUuid(id)) {
          const page = get().pages.find((p) => p.id === id);
          if (!page) return;

          if (isContentEdit) {
            // Debounce content and title updates (Google Docs style)
            set((s) => ({
              savingPages: { ...s.savingPages, [id]: 'saving' }
            }));

            if (updateTimers[id]) {
              clearTimeout(updateTimers[id]);
            }

            updateTimers[id] = setTimeout(async () => {
              delete updateTimers[id];
              try {
                const currentPage = get().pages.find((p) => p.id === id);
                if (currentPage) {
                  const matchedDb = currentPage.databaseId ? get().databases.find((db) => db.id === currentPage.databaseId) : undefined;
                  const contentStr = serializePageContent(currentPage, matchedDb);
                  await api.updateNote(id, currentPage.title || 'Untitled', contentStr);
                }
                if (!updateTimers[id]) {
                  set((s) => ({
                    savingPages: { ...s.savingPages, [id]: 'saved' }
                  }));
                }
              } catch (err) {
                console.error('Failed to update page on backend:', err);
                if (!updateTimers[id]) {
                  set((s) => ({
                    savingPages: { ...s.savingPages, [id]: 'error' }
                  }));
                }
              }
            }, 1000);
          } else {
            // Immediate sync for other changes (cover, icon, settings)
            const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
            const contentStr = serializePageContent(page, matchedDb);
            api.updateNote(id, page.title || 'Untitled', contentStr)
              .then(() => {
                if (!updateTimers[id]) {
                  set((s) => ({
                    savingPages: { ...s.savingPages, [id]: 'saved' }
                  }));
                }
              })
              .catch((err) => {
                console.error('Failed to update page on backend:', err);
                if (!updateTimers[id]) {
                  set((s) => ({
                    savingPages: { ...s.savingPages, [id]: 'error' }
                  }));
                }
              });
          }
        }
      },

      deletePage: (id) => {
        let parentIdsToSync: string[] = [];
        set((s) => {
          const updated = s.pages.map((p) => {
            if (p.id === id) return { ...p, isDeleted: true, deletedAt: Date.now() };
            if (p.children.includes(id)) {
              parentIdsToSync.push(p.id);
              return { ...p, children: p.children.filter((c) => c !== id) };
            }
            return p;
          });
          const newTopLevel = s.topLevelPageIds.filter((tid) => tid !== id);
          const view = s.activeView;
          const newView: AppView = view.type === 'page' && view.id === id ? { type: 'home' } : view;
          return { pages: updated, topLevelPageIds: newTopLevel, activeView: newView };
        });
        
        parentIdsToSync.forEach(pId => get()._syncPageToBackend(pId));

        // Sync soft deletion to backend
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to soft delete page on backend', err));
        }
      },

      restorePage: (id) => {
        let parentToSync: string | null = null;
        set((s) => {
          const page = s.pages.find((p) => p.id === id);
          if (!page) return s;
          const updated = s.pages.map((p) =>
            p.id === id ? { ...p, isDeleted: false, deletedAt: undefined } : p
          );
          const parentId = page.parentId;
          if (!parentId) {
            return { pages: updated, topLevelPageIds: [id, ...s.topLevelPageIds] };
          }
          const parentExists = updated.find((p) => p.id === parentId && !p.isDeleted);
          if (!parentExists) {
            return {
              pages: updated.map((p) => p.id === id ? { ...p, parentId: null } : p),
              topLevelPageIds: [id, ...s.topLevelPageIds],
            };
          }
          parentToSync = parentId;
          return {
            pages: updated.map((p) =>
              p.id === parentId ? { ...p, children: [...p.children, id] } : p
            ),
          };
        });

        if (parentToSync) get()._syncPageToBackend(parentToSync);

        // Sync restoration to backend
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to restore page on backend', err));
        }
      },

      permanentlyDeletePage: (id) => {
        set((s) => ({
          pages: s.pages.filter((p) => p.id !== id),
        }));

        // Trigger permanent hard-delete on backend
        if (api.getToken() && isUuid(id)) {
          api.deleteNote(id)
            .catch((err) => console.error('Failed to permanently delete page on backend', err));
        }
      },

      toggleFavorite: (id) => {
        set((s) => {
          const page = s.pages.find((p) => p.id === id);
          const adding = !page?.isFavorite;
          const newOrder = adding
            ? [id, ...s.favoriteOrder.filter((f) => f !== id)]
            : s.favoriteOrder.filter((f) => f !== id);
          return {
            pages: s.pages.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p),
            favoriteOrder: newOrder,
          };
        });

        // Sync to backend
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to update favorite status on backend', err));
        }
      },

      toggleExpanded: (id) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, isExpanded: !p.isExpanded } : p
          ),
        }));
      },

      movePage: (id, newParentId, _afterId) => {
        let oldParentIdToSync: string | null = null;
        set((s) => {
          const page = s.pages.find((p) => p.id === id);
          if (!page) return s;
          const oldParentId = page.parentId;
          oldParentIdToSync = oldParentId;
          let pages = s.pages.map((p) => {
            if (p.id === oldParentId) return { ...p, children: p.children.filter((c) => c !== id) };
            if (p.id === newParentId) return { ...p, children: [...p.children, id] };
            if (p.id === id) return { ...p, parentId: newParentId };
            return p;
          });
          let topLevelPageIds = s.topLevelPageIds;
          if (!oldParentId) topLevelPageIds = topLevelPageIds.filter((t) => t !== id);
          if (!newParentId) topLevelPageIds = [id, ...topLevelPageIds];
          return { pages, topLevelPageIds };
        });

        if (oldParentIdToSync) get()._syncPageToBackend(oldParentIdToSync);
        if (newParentId) get()._syncPageToBackend(newParentId);

        // Sync move to backend
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to update page hierarchy on backend', err));
        }
      },

      // ── Navigation ───────────────────────────────────────────────────────

      navigate: (view) => {
        const currentView = get().activeView;
        const currentViewStr = JSON.stringify(currentView);
        const nextViewStr = JSON.stringify(view);

        if (currentViewStr === nextViewStr) return;

        set((s) => ({
          activeView: view,
          viewHistory: [...s.viewHistory, currentView],
        }));
      },
      navigateToPage: (id) => {
        const currentView = get().activeView;
        const nextView: AppView = { type: 'page', id };
        const currentViewStr = JSON.stringify(currentView);
        const nextViewStr = JSON.stringify(nextView);

        set((s) => {
          const hist = [id, ...s.visitHistory.filter((v) => v !== id)].slice(0, 8);
          const nextHistory = currentViewStr === nextViewStr ? s.viewHistory : [...s.viewHistory, currentView];
          return {
            activeView: nextView,
            visitHistory: hist,
            viewHistory: nextHistory,
          };
        });
      },
      navigateToSettings: (section = 'account') => {
        const currentView = get().activeView;
        const nextView: AppView = { type: 'settings', section };
        const currentViewStr = JSON.stringify(currentView);
        const nextViewStr = JSON.stringify(nextView);

        set((s) => {
          const nextHistory = currentViewStr === nextViewStr ? s.viewHistory : [...s.viewHistory, currentView];
          return {
            activeView: nextView,
            viewHistory: nextHistory,
          };
        });
      },
      goBack: () => {
        set((s) => {
          let nextHistory = [...s.viewHistory];
          while (nextHistory.length > 0) {
            const previousView = nextHistory.pop()!;
            if (previousView.type === 'page') {
              const exists = s.pages.find((p) => p.id === previousView.id && !p.isDeleted);
              if (!exists) continue; // Skip deleted pages in history
            }
            return {
              activeView: previousView,
              viewHistory: nextHistory,
            };
          }
          // If no valid view remains in history, default to home
          return {
            activeView: { type: 'home' },
            viewHistory: [],
          };
        });
      },

      // ── Database actions ─────────────────────────────────────────────────

      updateDatabase: (id, patch) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id === id ? { ...db, ...patch, updatedAt: Date.now() } : db
          ),
        }));

        // Find the page hosting this database and trigger page content update
        const hostPage = get().pages.find((p) => p.databaseId === id);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === id);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to update database schema on backend', err));
          }
        }
      },

      addDatabaseRow: (databaseId, values = {}) => {
        const id = nanoid();
        set((s) => ({
          databases: s.databases.map((db) => {
            if (db.id !== databaseId) return db;
            const maxOrder = db.rows.reduce((m, r) => Math.max(m, r.order), -1);
            return {
              ...db,
              rows: [...db.rows, { id, values: { title: '', ...values }, order: maxOrder + 1 }],
              updatedAt: Date.now(),
            };
          }),
        }));

        const hostPage = get().pages.find((p) => p.databaseId === databaseId);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === databaseId);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to sync new database row to backend', err));
          }
        }

        return id;
      },

      updateDatabaseRow: (databaseId, rowId, values) => {
        set((s) => ({
          databases: s.databases.map((db) => {
            if (db.id !== databaseId) return db;
            return {
              ...db,
              rows: db.rows.map((r) =>
                r.id === rowId ? { ...r, values: { ...r.values, ...values } } : r
              ),
              updatedAt: Date.now(),
            };
          }),
        }));

        const hostPage = get().pages.find((p) => p.databaseId === databaseId);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === databaseId);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to update database row on backend', err));
          }
        }
      },

      deleteDatabaseRow: (databaseId, rowId) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id === databaseId
              ? { ...db, rows: db.rows.filter((r) => r.id !== rowId) }
              : db
          ),
        }));

        const hostPage = get().pages.find((p) => p.databaseId === databaseId);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === databaseId);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to delete database row on backend', err));
          }
        }
      },

      setDatabaseView: (databaseId, viewId) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id === databaseId ? { ...db, activeViewId: viewId } : db
          ),
        }));
      },

      moveBoardRow: (databaseId, rowId, newGroupValue, groupPropertyId) => {
        set((s) => ({
          databases: s.databases.map((db) => {
            if (db.id !== databaseId) return db;
            return {
              ...db,
              rows: db.rows.map((r) =>
                r.id === rowId
                  ? { ...r, values: { ...r.values, [groupPropertyId]: newGroupValue } }
                  : r
              ),
            };
          }),
        }));

        const hostPage = get().pages.find((p) => p.databaseId === databaseId);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === databaseId);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to update board view state on backend', err));
          }
        }
      },

      // ── Database view filters/sorts ──────────────────────────────────────

      updateDatabaseViewFilters: (databaseId, viewId, filters) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id !== databaseId ? db : {
              ...db,
              views: db.views.map((v) => v.id !== viewId ? v : { ...v, filters }),
            }
          ),
        }));

        const hostPage = get().pages.find((p) => p.databaseId === databaseId);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === databaseId);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to sync view filters on backend', err));
          }
        }
      },

      updateDatabaseViewSorts: (databaseId, viewId, sorts) => {
        set((s) => ({
          databases: s.databases.map((db) =>
            db.id !== databaseId ? db : {
              ...db,
              views: db.views.map((v) => v.id !== viewId ? v : { ...v, sorts }),
            }
          ),
        }));

        const hostPage = get().pages.find((p) => p.databaseId === databaseId);
        if (hostPage && api.getToken() && isUuid(hostPage.id)) {
          const updatedDb = get().databases.find((db) => db.id === databaseId);
          if (updatedDb) {
            const contentStr = serializePageContent(hostPage, updatedDb);
            api.updateNote(hostPage.id, hostPage.title || 'Database View', contentStr)
              .catch((err) => console.error('Failed to sync view sorting on backend', err));
          }
        }
      },

      // ── Internal seed loader ─────────────────────────────────────────────

      _loadSeed: (data) => {
        set({
          pages: data.pages,
          databases: data.databases,
          topLevelPageIds: data.topLevelPageIds,
          activeView: { type: 'page', id: data.topLevelPageIds[0] },
        });
      },

      // ── Settings ─────────────────────────────────────────────────────────

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateWorkspace: (patch) => set((s) => ({ workspace: { ...s.workspace, ...patch } })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(480, w)) }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
      setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
      setAiKey: (key) => set({ aiKey: key }),
      logVisit: (id) => set((s) => ({ visitHistory: [id, ...s.visitHistory.filter((v) => v !== id)].slice(0, 8) })),
      reorderTopLevelPages: (newOrder) => {
        set({ topLevelPageIds: newOrder });

        const updatedPages = get().pages.map((p) => {
          if (!p.parentId && !p.isDeleted) {
            const idx = newOrder.indexOf(p.id);
            if (idx !== -1) {
              return { ...p, position: idx };
            }
          }
          return p;
        });

        set({ pages: updatedPages });

        if (api.getToken()) {
          newOrder.forEach((id) => {
            const page = updatedPages.find((p) => p.id === id);
            if (page && isUuid(id)) {
              const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
              const contentStr = serializePageContent(page, matchedDb);
              api.updateNote(id, page.title || 'Untitled', contentStr)
                .catch((err) => console.error('Failed to sync reordered top level page position:', err));
            }
          });
        }
      },

      reorderChildren: (parentId, newOrder) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === parentId ? { ...p, children: newOrder } : p
          ),
        }));

        const page = get().pages.find((p) => p.id === parentId);
        if (page && api.getToken() && isUuid(parentId)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(parentId, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to reorder children on backend', err));
        }
      },

      reorderFavorites: (newOrder) => {
        set({ favoriteOrder: newOrder });

        const updatedPages = get().pages.map((p) => {
          if (p.isFavorite && !p.isDeleted) {
            const idx = newOrder.indexOf(p.id);
            if (idx !== -1) {
              return { ...p, favoritePosition: idx };
            }
          }
          return p;
        });

        set({ pages: updatedPages });

        if (api.getToken()) {
          newOrder.forEach((id) => {
            const page = updatedPages.find((p) => p.id === id);
            if (page && isUuid(id)) {
              const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
              const contentStr = serializePageContent(page, matchedDb);
              api.updateNote(id, page.title || 'Untitled', contentStr)
                .catch((err) => console.error('Failed to sync reordered favorite page position:', err));
            }
          });
        }
      },

      setPagePrivate: (id, isPrivate) => {
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, isPrivate } : p) }));
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to update page security on backend', err));
        }
      },

      setPageExpiry: (id, expiresAt) => {
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, expiresAt } : p) }));
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to update page TTL expiry on backend', err));
        }
      },

      saveSnapshot: (id, wordCount) => {
        const page = get().pages.find((p) => p.id === id);
        if (!page) return;
        const snap: PageSnapshot = {
          id: nanoid(),
          content: page.content,
          title: page.title,
          savedAt: Date.now(),
          wordCount,
        };
        set((s) => ({
          pages: s.pages.map((p) => p.id === id ? {
            ...p,
            snapshots: [snap, ...(p.snapshots ?? [])].slice(0, 20),
          } : p),
        }));

        const updatedPage = get().pages.find((p) => p.id === id);
        if (updatedPage && api.getToken() && isUuid(id)) {
          const matchedDb = updatedPage.databaseId ? get().databases.find((db) => db.id === updatedPage.databaseId) : undefined;
          const contentStr = serializePageContent(updatedPage, matchedDb);
          api.updateNote(id, updatedPage.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to save snapshot to backend', err));
        }
      },

      setPageTags: (id, tags) => {
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, tags } : p) }));
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to sync page tags to backend', err));
        }
      },

      setPageAiSummary: (id, summary) => {
        set((s) => ({ pages: s.pages.map((p) => p.id === id ? { ...p, aiSummary: summary } : p) }));
        const page = get().pages.find((p) => p.id === id);
        if (page && api.getToken() && isUuid(id)) {
          const matchedDb = page.databaseId ? get().databases.find((db) => db.id === page.databaseId) : undefined;
          const contentStr = serializePageContent(page, matchedDb);
          api.updateNote(id, page.title || 'Untitled', contentStr)
            .catch((err) => console.error('Failed to sync page AI summary to backend', err));
        }
      },

      getDailyNoteId: () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const title = `Daily Note — ${today}`;
        const existing = get().pages.find((p) => p.title === title && !p.isDeleted);
        if (existing) {
          get().navigateToPage(existing.id);
          return existing.id;
        }
        const id = get().createPage(null);
        get().updatePage(id, {
          title,
          icon: '📅',
          content: {
            type: 'doc',
            content: [
              { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: today }] },
              { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🌅 Morning intentions' }] },
              { type: 'paragraph' },
              { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '✅ Today\'s focus' }] },
              { type: 'taskList', content: [
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              ]},
              { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '🌙 Evening reflection' }] },
              { type: 'paragraph' },
            ],
          },
        });
        return id;
      },
      setInboxOpen: (open) => set({ inboxOpen: open }),
      markInboxRead: () => {
        set((s) => ({ inboxItems: s.inboxItems.map((i) => ({ ...i, read: true })) }));
        if (api.getToken()) {
          get().inboxItems.forEach((item) => {
            if (item.type === 'reminder' && !item.read) {
              api.completeReminder(item.id).catch(() => {});
            }
          });
        }
      },

      // ── Vault actions ─────────────────────────────────────────────────────

      setupVault: async (masterPassword) => {
        const salt = generateSalt();
        const key = await deriveKey(masterPassword, salt);
        const verifier = await makeVerifier(key);
        vaultKey = key;
        set({
          vaultMeta: { initialized: true, salt, verifier, autoLockMinutes: get().vaultMeta.autoLockMinutes },
          vaultUnlocked: true,
          vaultEntries: [],
          vaultEncrypted: [],
        });
      },

      unlockVault: async (masterPassword) => {
        const { vaultMeta } = get();
        if (!vaultMeta.initialized) return false;
        const key = await deriveKey(masterPassword, vaultMeta.salt);
        const ok = await checkVerifier(vaultMeta.verifier, key);
        if (!ok) return false;
        
        vaultKey = key;
        set({ vaultUnlocked: true });

        // Retrieve entries from backend and decrypt
        if (api.getToken()) {
          try {
            const backendVault = await api.getVaultEntries();
            const entries: VaultEntry[] = [];
            const vaultEncrypted: EncryptedVaultEntry[] = [];

            for (const v of backendVault) {
              try {
                const json = await decryptString(v.value, key);
                const entry = JSON.parse(json) as VaultEntry;
                entry.id = v.id;
                entries.push(entry);
                vaultEncrypted.push({
                  id: v.id,
                  blob: v.value,
                  createdAt: v.createdAt ? new Date(v.createdAt).getTime() : Date.now(),
                  updatedAt: v.createdAt ? new Date(v.createdAt).getTime() : Date.now(),
                });
              } catch { /* decrypt fail */ }
            }
            entries.sort((a, b) => b.updatedAt - a.updatedAt);
            set({ vaultEntries: entries, vaultEncrypted });
          } catch (e) {
            console.error('Failed to decrypt backend vault entries:', e);
          }
        }
        return true;
      },

      lockVault: () => {
        vaultKey = null;
        set({ vaultUnlocked: false, vaultEntries: [] });
      },

      resetVault: () => {
        vaultKey = null;
        set({
          vaultMeta: { initialized: false, salt: '', verifier: '', autoLockMinutes: 5 },
          vaultEncrypted: [],
          vaultUnlocked: false,
          vaultEntries: [],
        });
      },

      addVaultEntry: async (entry) => {
        if (!vaultKey) return;
        const now = Date.now();
        const full: VaultEntry = { ...entry, id: nanoid(), createdAt: now, updatedAt: now };
        const blob = await encryptString(JSON.stringify(full), vaultKey);

        if (api.getToken()) {
          try {
            const created = await api.createVaultEntry(full.title, full.category as any, blob, full.expiresAt ? new Date(full.expiresAt).toISOString() : undefined);
            full.id = created.id;
            set((s) => ({
              vaultEntries: [full, ...s.vaultEntries],
              vaultEncrypted: [{ id: created.id, blob, createdAt: now, updatedAt: now }, ...s.vaultEncrypted],
            }));
          } catch (e) {
            console.error('Failed to save encrypted vault entry to backend:', e);
          }
        } else {
          set((s) => ({
            vaultEntries: [full, ...s.vaultEntries],
            vaultEncrypted: [{ id: full.id, blob, createdAt: now, updatedAt: now }, ...s.vaultEncrypted],
          }));
        }
      },

      updateVaultEntry: async (id, patch) => {
        if (!vaultKey) return;
        const existing = get().vaultEntries.find((e) => e.id === id);
        if (!existing) return;
        const updated: VaultEntry = { ...existing, ...patch, updatedAt: Date.now() };
        const blob = await encryptString(JSON.stringify(updated), vaultKey);

        if (api.getToken() && isUuid(id)) {
          try {
            await api.deleteVaultEntry(id);
            const created = await api.createVaultEntry(updated.title, updated.category as any, blob, updated.expiresAt ? new Date(updated.expiresAt).toISOString() : undefined);
            updated.id = created.id;
            set((s) => ({
              vaultEntries: s.vaultEntries.map((e) => e.id === id ? updated : e),
              vaultEncrypted: s.vaultEncrypted.map((e) => e.id === id ? { ...e, id: created.id, blob, updatedAt: updated.updatedAt } : e),
            }));
          } catch (e) {
            console.error('Failed to update vault entry:', e);
          }
        } else {
          set((s) => ({
            vaultEntries: s.vaultEntries.map((e) => e.id === id ? updated : e),
            vaultEncrypted: s.vaultEncrypted.map((e) => e.id === id ? { ...e, blob, updatedAt: updated.updatedAt } : e),
          }));
        }
      },

      deleteVaultEntry: (id) => {
        set((s) => ({
          vaultEntries: s.vaultEntries.filter((e) => e.id !== id),
          vaultEncrypted: s.vaultEncrypted.filter((e) => e.id !== id),
        }));

        if (api.getToken() && isUuid(id)) {
          api.deleteVaultEntry(id)
            .catch((err) => console.error('Failed to delete vault entry from backend', err));
        }
      },

      setVaultAutoLock: (minutes) =>
        set((s) => ({ vaultMeta: { ...s.vaultMeta, autoLockMinutes: minutes } })),

      // ── Auth actions ──────────────────────────────────────────────────────

      signIn: async (profile, idToken) => {
        const tokenToUse = idToken || "mock_google_id_token_vishnu";
        const data = await api.googleLogin(tokenToUse);
        api.setToken(data.token);

        set((s) => ({
          isAuthenticated: true,
          user: profile
            ? { ...s.user, ...profile, id: data.id }
            : { ...s.user, id: data.id },
        }));

        await get().syncWithBackend();
      },

      emailLogin: async (email, password) => {
        return await api.login(email, password);
      },

      verifyOtp: async (email, code) => {
        const data = await api.verifyOtp(email, code);
        set({
          isAuthenticated: true,
          user: {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar: '🧑',
            color: '#2383e2',
          },
        });
        await get().syncWithBackend();
      },

      emailRegister: async (name, email, password) => {
        await api.register(name, email, password);
      },

      signOut: () => {
        vaultKey = null;
        api.logout();
        set({
          isAuthenticated: false,
          savingPages: {},
          vaultUnlocked: false,
          vaultEntries: [],
          vaultEncrypted: [],
          vaultMeta: { initialized: false, salt: '', verifier: '', autoLockMinutes: 5 },
          pages: [],
          databases: [],
          topLevelPageIds: [],
          visitHistory: [],
          inboxItems: [],
          favoriteOrder: [],
          user: {
            id: nanoid(),
            name: 'You',
            email: 'you@example.com',
            avatar: '🧑',
            color: '#2383e2',
          },
          activeView: { type: 'home' }
        });
      },

      // ── Selectors ────────────────────────────────────────────────────────

      getPage: (id) => get().pages.find((p) => p.id === id),
      getDatabase: (id) => get().databases.find((db) => db.id === id),
      getPagePath: (id) => {
        const pages = get().pages;
        const path: Page[] = [];
        let current = pages.find((p) => p.id === id);
        while (current) {
          path.unshift(current);
          current = current.parentId
            ? pages.find((p) => p.id === current!.parentId)
            : undefined;
        }
        return path;
      },
      getChildPages: (parentId) =>
        get().pages.filter((p) => p.parentId === parentId && !p.isDeleted),
      getFavoritePages: () =>
        get().pages.filter((p) => p.isFavorite && !p.isDeleted),
      getDeletedPages: () =>
        get().pages.filter((p) => p.isDeleted),
    }),
    {
      name: 'notebook-2.0-v4',
      partialize: (state) => {
        const { vaultUnlocked, vaultEntries, searchOpen, inboxOpen, shortcutsOpen, zenMode, savingPages, ...rest } = state;
        void vaultUnlocked; void vaultEntries; void searchOpen;
        void inboxOpen; void shortcutsOpen; void zenMode; void savingPages;
        return rest as typeof state;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.vaultUnlocked = false;
          state.vaultEntries = [];
          if (api.getToken()) {
            state.isAuthenticated = true;
            // Async verify server status and sync if online
            api.checkServer()
              .then((online) => {
                state.setIsServerOnline(online);
                if (online) {
                  state.syncWithBackend().catch(() => {});
                }
              })
              .catch(() => {
                state.setIsServerOnline(false);
              });
          }
        }
      },
    }
  )
);

// Register global API unauthorized callback
api.onUnauthorized(() => {
  useStore.getState().signOut();
});
