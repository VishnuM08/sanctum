export type AppView =
  | { type: 'page'; id: string }
  | { type: 'settings'; section: SettingsSection }
  | { type: 'templates'; category?: string }
  | { type: 'calendar' }
  | { type: 'vault' }
  | { type: 'trash' }
  | { type: 'agent' }
  | { type: 'home' };

export type VaultCategory = 'login' | 'card' | 'note' | 'identity' | 'other';

/** Decrypted entry — only ever exists in memory while the vault is unlocked. */
export interface VaultEntry {
  id: string;
  category: VaultCategory;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

/** What actually gets persisted: an opaque encrypted blob per entry. */
export interface EncryptedVaultEntry {
  id: string;
  blob: string;       // base64(iv ‖ AES-GCM ciphertext) of the JSON entry
  createdAt: number;
  updatedAt: number;
}

export interface VaultMeta {
  initialized: boolean;
  salt: string;       // base64 PBKDF2 salt
  verifier: string;   // encrypted known string to validate the master password
  autoLockMinutes: number;
}

export type SettingsSection =
  | 'account' | 'notifications' | 'connections'
  | 'workspace' | 'members' | 'billing' | 'security';

export type DatabaseViewType =
  | 'table' | 'board' | 'gallery' | 'list' | 'calendar' | 'timeline';

export type PropertyType =
  | 'title' | 'text' | 'number' | 'select' | 'multiSelect'
  | 'date' | 'checkbox' | 'url' | 'email' | 'phone';

export type SelectColor =
  | 'gray' | 'brown' | 'orange' | 'yellow'
  | 'green' | 'blue' | 'purple' | 'pink' | 'red';

export const SELECT_COLORS: Record<SelectColor, { bg: string; text: string; darkBg: string; darkText: string }> = {
  gray:   { bg: '#E3E2E0', text: '#787774', darkBg: '#373530', darkText: '#9B9A97' },
  brown:  { bg: '#EEE0DA', text: '#976D57', darkBg: '#3E2723', darkText: '#A1887F' },
  orange: { bg: '#FADEC9', text: '#CC772F', darkBg: '#3E2723', darkText: '#FF8A65' },
  yellow: { bg: '#FDECC8', text: '#C18D14', darkBg: '#332D00', darkText: '#FFD54F' },
  green:  { bg: '#DBEDDB', text: '#448361', darkBg: '#1B2D1B', darkText: '#66BB6A' },
  blue:   { bg: '#D3E5EF', text: '#337EA9', darkBg: '#0D1E2C', darkText: '#42A5F5' },
  purple: { bg: '#E8DEEE', text: '#9065B0', darkBg: '#2C1B3E', darkText: '#AB47BC' },
  pink:   { bg: '#F5E0E9', text: '#C14C8A', darkBg: '#3E1728', darkText: '#EC407A' },
  red:    { bg: '#FFE2DD', text: '#C4403D', darkBg: '#3E1A1A', darkText: '#EF5350' },
};

export interface SelectOption {
  id: string;
  name: string;
  color: SelectColor;
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[];
  width: number;
  hidden: boolean;
}

export interface DatabaseRow {
  id: string;
  values: Record<string, DatabaseCellValue>;
  order: number;
}

export type DatabaseCellValue = string | number | boolean | string[] | null;

export interface DatabaseSortConfig {
  propertyId: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseFilterConfig {
  propertyId: string;
  condition: string;
  value: DatabaseCellValue;
}

export interface DatabaseView {
  id: string;
  name: string;
  type: DatabaseViewType;
  groupByPropertyId?: string;
  sorts: DatabaseSortConfig[];
  filters: DatabaseFilterConfig[];
  hiddenPropertyIds: string[];
}

export interface Database {
  id: string;
  title: string;
  icon: string;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  activeViewId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CoverConfig {
  type: 'gradient' | 'color' | 'url';
  value: string;
  position: number;
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  cover?: CoverConfig;
  content: unknown;
  parentId: string | null;
  children: string[];
  isExpanded: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: number;
  isPublished: boolean;
  isLocked: boolean;
  isPrivate: boolean;
  font: 'default' | 'serif' | 'mono';
  isFullWidth: boolean;
  isSmallText: boolean;
  databaseId?: string;
  expiresAt?: number;
  snapshots?: PageSnapshot[];   // version history
  tags?: string[];              // smart tags
  aiSummary?: string;           // one-line AI summary
  position?: number;            // top-level manual order index
  favoritePosition?: number;   // favorite list manual order index
  createdAt: number;
  updatedAt: number;
}

export interface InboxItem {
  id: string;
  type: 'mention' | 'edit' | 'reminder' | 'comment';
  title: string;
  pageId?: string;
  time: number;
  read: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  plan: 'free' | 'plus' | 'business';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
}

export interface PageSnapshot {
  id: string;
  content: unknown;
  title: string;
  savedAt: number;
  wordCount: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'default' | 'spacious';
  typewriterMode: boolean;
}

export const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
];

export const COVER_COLORS = [
  '#d44c47', '#e9973f', '#dfab01', '#4d9f3a',
  '#2f8fc0', '#485fc0', '#9d46b5', '#9a5e96',
  '#7d7d7d', '#4e5257',
];

export interface Reminder {
  id: string;
  title: string;
  remindAt: string;
  context?: string;
  aiGenerated: boolean;
  fired: boolean;
  noteId?: string;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  noteTitle?: string;
  payload?: string;
}

export interface Settings {
  notifications: {
    morningDigest: boolean;
    reminders: boolean;
    expiryWarnings: boolean;
  };
  ai: {
    autoExtractReminders: boolean;
    generateSummaries: boolean;
    suggestTags: boolean;
    model: 'haiku' | 'sonnet' | 'opus';
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  aiSummary?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiGenerated?: boolean;
}

