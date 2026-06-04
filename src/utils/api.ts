import { Note, VaultEntry, Reminder, AgentLog, Settings } from '../types';

const getDefaultApiBase = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        // Prepend -api to the first subdomain segment (e.g., sanctum.domain.com -> sanctum-api.domain.com)
        parts[0] = `${parts[0]}-api`;
        return `${protocol}//${parts.join('.')}/api`;
      }
    }
  }
  return 'http://localhost:8080/api';
};


let API_BASE = localStorage.getItem('vault-api-server-url') || getDefaultApiBase();

// Connection status cache
let isServerOnline = false;
let checkPromise: Promise<boolean> | null = null;

export const api = {
  getApiBase(): string {
    return API_BASE;
  },

  setApiBase(url: string) {
    localStorage.setItem('vault-api-server-url', url);
    API_BASE = url;
  },

  // Check if backend server is available
  async checkServer(): Promise<boolean> {
    if (checkPromise) return checkPromise;

    checkPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

        // Ping the auth/me endpoint (will return 401 if online, or network error if offline)
        const response = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        isServerOnline = true;
        return true;
      } catch (err: any) {
        // A network error (e.g. Connection Refused) means the server is down.
        // If aborted, it means timeout, so we also consider it offline.
        isServerOnline = false;
        return false;
      }
    })();

    // Cache check results for 10 seconds, then reset cache
    setTimeout(() => {
      checkPromise = null;
    }, 10000);

    return checkPromise;
  },

  isOnline(): boolean {
    return isServerOnline;
  },

  // Auth token helpers
  getToken(): string | null {
    return localStorage.getItem('vault-jwt-token');
  },

  setToken(token: string) {
    localStorage.setItem('vault-jwt-token', token);
  },

  clearToken() {
    localStorage.removeItem('vault-jwt-token');
  },

  getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  },

  // Authentication API
  async login(email: string, password: string): Promise<{ otpRequired?: boolean; email?: string; token?: string; id?: string; name?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Invalid email or password');
    }
    const data = await res.json();
    if (data.otpRequired) {
      return data;
    }
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('vault-user', JSON.stringify({ name: data.name, email: data.email }));
    }
    return data;
  },

  async verifyOtp(email: string, code: string): Promise<{ token: string; id: string; name: string; email: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Invalid or expired verification code');
    }
    const data = await res.json();
    this.setToken(data.token);
    localStorage.setItem('vault-user', JSON.stringify({ name: data.name, email: data.email }));
    return data;
  },

  async register(name: string, email: string, password: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Registration failed');
    }
    return res.json();
  },

  logout() {
    this.clearToken();
    localStorage.removeItem('vault-user');
  },

  // Notes API
  async getNotes(): Promise<Note[]> {
    const res = await fetch(`${API_BASE}/notes`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  async createNote(title: string, content: string): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },

  async updateNote(id: string, title: string, content: string): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },

  async deleteNote(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete note');
  },

  // Vault API
  async getVaultEntries(): Promise<VaultEntry[]> {
    const res = await fetch(`${API_BASE}/vault`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vault items');
    return res.json();
  },

  async createVaultEntry(title: string, type: VaultEntry['type'], value: string, expiresAt?: string): Promise<VaultEntry> {
    const res = await fetch(`${API_BASE}/vault`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, type, value, expiresAt: expiresAt || null }),
    });
    if (!res.ok) throw new Error('Failed to save vault item');
    return res.json();
  },

  async deleteVaultEntry(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/vault/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete vault item');
  },

  // Reminders API
  async getReminders(): Promise<Reminder[]> {
    const res = await fetch(`${API_BASE}/reminders`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch reminders');
    return res.json();
  },

  async createReminder(title: string, remindAt: string, context?: string, noteId?: string): Promise<Reminder> {
    // Convert format like "Next week" or "Tomorrow at 10:00 AM" to ISO string if needed
    let isoDate: string;
    try {
      // Try parsing if it is standard date input
      isoDate = new Date(remindAt).toISOString();
    } catch {
      // Fallback relative date calculations for manually typed text
      const date = new Date();
      if (remindAt.toLowerCase().includes('tomorrow')) {
        date.setDate(date.getDate() + 1);
        date.setHours(10, 0, 0, 0);
      } else if (remindAt.toLowerCase().includes('weekend')) {
        date.setDate(date.getDate() + (6 - date.getDay())); // Saturday
        date.setHours(10, 0, 0, 0);
      } else {
        date.setDate(date.getDate() + 3); // next few days
      }
      isoDate = date.toISOString();
    }

    const res = await fetch(`${API_BASE}/reminders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, remindAt: isoDate, context, noteId }),
    });
    if (!res.ok) throw new Error('Failed to create reminder');
    return res.json();
  },

  async completeReminder(id: string): Promise<Reminder> {
    const res = await fetch(`${API_BASE}/reminders/${id}/complete`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to complete reminder');
    return res.json();
  },

  async deleteReminder(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete reminder');
  },

  // Agent API
  async getAgentLogs(): Promise<AgentLog[]> {
    const res = await fetch(`${API_BASE}/agent/logs`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch agent logs');
    return res.json();
  },

  async getDailyDigest(): Promise<string> {
    const res = await fetch(`${API_BASE}/agent/digest`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to build daily digest');
    const data = await res.json();
    return data.digest;
  },

  async chatWithAgent(message: string): Promise<string> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to query agent');
    const data = await res.json();
    return data.reply;
  },

  async googleLogin(idToken: string): Promise<{ token: string; id: string; name: string; email: string }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Google login failed');
    }
    const data = await res.json();
    this.setToken(data.token);
    localStorage.setItem('vault-user', JSON.stringify({ id: data.id, name: data.name, email: data.email }));
    return data;
  },

  async syncLocalData(vaultPassword?: string): Promise<{ notesCount: number; vaultCount: number }> {
    let notesCount = 0;
    let vaultCount = 0;

    // 1. Sync Notes
    try {
      const localNotesRaw = localStorage.getItem('notes');
      if (localNotesRaw) {
        const localNotes: Note[] = JSON.parse(localNotesRaw);
        const unsyncedNotes = localNotes.filter(n => !n.id.includes('-'));

        for (const note of unsyncedNotes) {
          const created = await this.createNote(note.title, note.content);
          const listRaw = localStorage.getItem('notes');
          if (listRaw) {
            const list: Note[] = JSON.parse(listRaw);
            const updated = list.map(n => n.id === note.id ? created : n);
            localStorage.setItem('notes', JSON.stringify(updated));
          }
          notesCount++;
        }
      }
    } catch (e) {
      console.error('Note sync failed:', e);
    }

    // 2. Sync Vault Entries
    try {
      const localVaultRaw = localStorage.getItem('vault');
      if (localVaultRaw && vaultPassword) {
        const localVault: VaultEntry[] = JSON.parse(localVaultRaw);
        const unsyncedVault = localVault.filter(v => !v.id.includes('-'));

        const { decryptData } = await import('./crypto');

        for (const entry of unsyncedVault) {
          try {
            const decrypted = await decryptData(entry.value, vaultPassword);
            const created = await this.createVaultEntry(entry.title, entry.type, decrypted, entry.expiresAt);
            const listRaw = localStorage.getItem('vault');
            if (listRaw) {
              const list: VaultEntry[] = JSON.parse(listRaw);
              const updated = list.map(v => v.id === entry.id ? created : v);
              localStorage.setItem('vault', JSON.stringify(updated));
            }
            vaultCount++;
          } catch (err) {
            console.error(`Failed to decrypt/sync vault item "${entry.title}":`, err);
          }
        }
      }
    } catch (e) {
      console.error('Vault sync failed:', e);
    }

    // 3. Sync Reminders
    try {
      const localRemindersRaw = localStorage.getItem('reminders');
      if (localRemindersRaw) {
        const localReminders: Reminder[] = JSON.parse(localRemindersRaw);
        const unsyncedReminders = localReminders.filter(r => !r.id.includes('-'));

        for (const reminder of unsyncedReminders) {
          let mappedNoteId = reminder.noteId;
          if (reminder.noteId) {
            const notesRaw = localStorage.getItem('notes');
            if (notesRaw) {
              const currentNotes: Note[] = JSON.parse(notesRaw);
              const matchingNote = currentNotes.find(n => n.title === reminder.context?.split('From note: ')[1]?.split('...')[0]);
              if (matchingNote && matchingNote.id.includes('-')) {
                mappedNoteId = matchingNote.id;
              }
            }
          }

          let remindAtIso = new Date().toISOString();
          try {
            if (reminder.remindAt.includes('at')) {
              const datePart = reminder.remindAt.split(' at ')[0];
              const timePart = reminder.remindAt.split(' at ')[1];
              remindAtIso = new Date(`${datePart} ${timePart}`).toISOString();
            } else {
              remindAtIso = new Date(reminder.remindAt).toISOString();
            }
          } catch {}

          const created = await this.createReminder(reminder.title, remindAtIso, reminder.context, mappedNoteId);
          const listRaw = localStorage.getItem('reminders');
          if (listRaw) {
            const list: Reminder[] = JSON.parse(listRaw);
            const updated = list.map(r => r.id === reminder.id ? created : r);
            localStorage.setItem('reminders', JSON.stringify(updated));
          }
        }
      }
    } catch (e) {
      console.error('Reminder sync failed:', e);
    }

    return { notesCount, vaultCount };
  }
};
