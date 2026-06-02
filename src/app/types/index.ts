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

export interface VaultEntry {
  id: string;
  title: string;
  type: 'password' | 'card' | 'contact' | 'note';
  value: string;
  expiresAt?: string;
  createdAt: string;
}

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
