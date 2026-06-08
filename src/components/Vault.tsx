import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Lock, Unlock, Plus, Search, Eye, EyeOff, Copy, Check,
  Trash2, KeyRound, ShieldCheck, RefreshCw, X, Star,
  CreditCard, FileText, User, Globe, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store';
import { useToast } from './Toast';
import { generatePassword, passwordStrength, type PwGenOptions } from '../utils/vaultCrypto';
import type { VaultEntry, VaultCategory } from '../types';
import { copyToClipboard } from '../utils/clipboard';

const CATEGORY_META: Record<VaultCategory, { label: string; icon: React.ReactNode; color: string }> = {
  login:    { label: 'Login',    icon: <Globe size={13} />,      color: '#2383e2' },
  card:     { label: 'Card',     icon: <CreditCard size={13} />, color: '#9065b0' },
  note:     { label: 'Note',     icon: <FileText size={13} />,   color: '#cc772f' },
  identity: { label: 'Identity', icon: <User size={13} />,       color: '#448361' },
  other:    { label: 'Other',    icon: <KeyRound size={13} />,   color: '#787774' },
};

export function Vault() {
  const vaultMeta     = useStore((s) => s.vaultMeta);
  const vaultUnlocked = useStore((s) => s.vaultUnlocked);

  if (!vaultMeta.initialized) return <VaultSetup />;
  if (!vaultUnlocked)         return <VaultLock />;
  return <VaultUnlocked />;
}

// ── Setup (first run) ────────────────────────────────────────────────────────

function VaultSetup() {
  const setupVault = useStore((s) => s.setupVault);
  const { toast }  = useToast();
  const [pw, setPw]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy]   = useState(false);

  const strength = passwordStrength(pw);
  const canSubmit = pw.length >= 8 && pw === confirm && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    await setupVault(pw);
    toast('Vault created and unlocked');
    setBusy(false);
  };

  return (
    <div className="vault-gate">
      <div className="vault-gate-card">
        <div className="vault-gate-icon"><ShieldCheck size={32} /></div>
        <h1 className="vault-gate-title">Set up your Vault</h1>
        <p className="vault-gate-sub">
          Create a master password. It encrypts everything with AES-256 and is the
          only way in — we never store it.
        </p>

        <div className="vault-warning">
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            If you forget the master password, your vault <strong>cannot be recovered</strong>.
            This is a local prototype — keep your most critical credentials in a dedicated manager.
          </span>
        </div>

        <label className="vault-field-label">Master password</label>
        <input
          className="vault-input"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="At least 8 characters"
          autoFocus
        />
        {pw && (
          <div className="vault-strength">
            <div className="vault-strength-bar">
              <div className={`vault-strength-fill s${strength.score}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
            </div>
            <span className="vault-strength-label">{strength.label}</span>
          </div>
        )}

        <label className="vault-field-label">Confirm master password</label>
        <input
          className="vault-input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {confirm && pw !== confirm && (
          <div className="vault-field-error">Passwords don't match</div>
        )}

        <button className="vault-primary-btn" disabled={!canSubmit} onClick={submit}>
          {busy ? 'Encrypting…' : 'Create Vault'}
        </button>
      </div>
    </div>
  );
}

// ── Lock screen ────────────────────────────────────────────────────────────────

function VaultLock() {
  const unlockVault = useStore((s) => s.unlockVault);
  const resetVault  = useStore((s) => s.resetVault);
  const { toast }   = useToast();
  const [pw, setPw]     = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true);
    setError(false);
    const ok = await unlockVault(pw);
    setBusy(false);
    if (ok) { toast('Vault unlocked'); }
    else { setError(true); setPw(''); inputRef.current?.focus(); }
  };

  return (
    <div className="vault-gate">
      <div className="vault-gate-card">
        <div className="vault-gate-icon locked"><Lock size={32} /></div>
        <h1 className="vault-gate-title">Vault locked</h1>
        <p className="vault-gate-sub">Enter your master password to unlock.</p>

        <input
          ref={inputRef}
          className={`vault-input ${error ? 'error' : ''}`}
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false); }}
          placeholder="Master password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {error && <div className="vault-field-error">Incorrect password</div>}

        <button className="vault-primary-btn" disabled={!pw || busy} onClick={submit}>
          {busy ? 'Decrypting…' : <><Unlock size={15} /> Unlock</>}
        </button>

        <button
          className="vault-text-btn"
          onClick={() => {
            if (confirm('Reset the vault? This permanently deletes ALL stored entries and cannot be undone.')) {
              resetVault();
              toast('Vault reset');
            }
          }}
        >
          Forgot password? Reset vault
        </button>
      </div>
    </div>
  );
}

// ── Unlocked vault ───────────────────────────────────────────────────────────

function VaultUnlocked() {
  const entries     = useStore((s) => s.vaultEntries);
  const lockVault   = useStore((s) => s.lockVault);
  const deleteEntry = useStore((s) => s.deleteVaultEntry);
  const autoLockMin = useStore((s) => s.vaultMeta.autoLockMinutes);
  const { toast }   = useToast();

  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState<VaultCategory | 'all'>('all');
  const [editing, setEditing]     = useState<VaultEntry | null>(null);
  const [creating, setCreating]   = useState(false);

  // Auto-lock on inactivity
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { lockVault(); }, autoLockMin * 60_000);
  }, [autoLockMin, lockVault]);

  useEffect(() => {
    resetTimer();
    const events = ['mousemove', 'keydown', 'click'];
    events.forEach((e) => document.addEventListener(e, resetTimer));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [resetTimer]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      const matchCat = catFilter === 'all' || e.category === catFilter;
      const matchQ = !q || e.title.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) || e.url.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [entries, search, catFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length };
    entries.forEach((e) => { c[e.category] = (c[e.category] ?? 0) + 1; });
    return c;
  }, [entries]);

  return (
    <div className="vault-page">
      {/* Header */}
      <div className="vault-header">
        <div className="vault-header-title">
          <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <h1>Vault</h1>
            <span>{entries.length} encrypted {entries.length === 1 ? 'item' : 'items'} · auto-locks after {autoLockMin} min</span>
          </div>
        </div>
        <div className="vault-header-actions">
          <button className="vault-add-btn" onClick={() => setCreating(true)}>
            <Plus size={15} /> New item
          </button>
          <button className="vault-lock-btn" onClick={() => { lockVault(); toast('Vault locked'); }}>
            <Lock size={14} /> Lock
          </button>
        </div>
      </div>

      <div className="vault-body">
        {/* Category sidebar */}
        <div className="vault-cats">
          <button className={`vault-cat ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>
            <KeyRound size={13} /> All items <span className="vault-cat-count">{counts.all ?? 0}</span>
          </button>
          {(Object.keys(CATEGORY_META) as VaultCategory[]).map((cat) => (
            <button key={cat} className={`vault-cat ${catFilter === cat ? 'active' : ''}`} onClick={() => setCatFilter(cat)}>
              {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
              <span className="vault-cat-count">{counts[cat] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="vault-main">
          <div className="vault-search">
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input placeholder="Search vault…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="vault-empty">
              <KeyRound size={36} style={{ opacity: 0.3 }} />
              <div style={{ fontWeight: 600, marginTop: 10 }}>{entries.length === 0 ? 'Your vault is empty' : 'No matches'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {entries.length === 0 ? 'Add your first encrypted item to get started.' : 'Try a different search or category.'}
              </div>
              {entries.length === 0 && (
                <button className="vault-add-btn" style={{ marginTop: 14 }} onClick={() => setCreating(true)}>
                  <Plus size={15} /> New item
                </button>
              )}
            </div>
          ) : (
            <div className="vault-list">
              {filtered.map((entry) => (
                <VaultRow key={entry.id} entry={entry} onClick={() => setEditing(entry)} onDelete={() => { deleteEntry(entry.id); toast('Item deleted'); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {(creating || editing) && (
        <VaultEntryModal
          entry={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

// ── Single row ─────────────────────────────────────────────────────────────────

function VaultRow({ entry, onClick, onDelete }: { entry: VaultEntry; onClick: () => void; onDelete: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyPassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(entry.password);
    setCopied(true);
    toast('Password copied — clears in 20s');
    setTimeout(() => setCopied(false), 2000);
    // Best-effort clipboard clear
    setTimeout(() => { copyToClipboard('').catch(() => {}); }, 20_000);
  };

  const meta = CATEGORY_META[entry.category];

  return (
    <div className="vault-row" onClick={onClick}>
      <div className="vault-row-icon" style={{ background: `${meta.color}1a`, color: meta.color }}>
        {meta.icon}
      </div>
      <div className="vault-row-body">
        <div className="vault-row-title">
          {entry.favorite && <Star size={11} fill="#f5c518" style={{ color: '#f5c518', flexShrink: 0 }} />}
          {entry.title || 'Untitled'}
        </div>
        <div className="vault-row-sub">{entry.username || entry.url || meta.label}</div>
      </div>
      <div className="vault-row-actions" onClick={(e) => e.stopPropagation()}>
        {entry.password && (
          <button className="vault-icon-btn" onClick={copyPassword} title="Copy password">
            {copied ? <Check size={14} style={{ color: '#448361' }} /> : <Copy size={14} />}
          </button>
        )}
        <button className="vault-icon-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Entry create/edit modal ──────────────────────────────────────────────────

function VaultEntryModal({ entry, onClose }: { entry: VaultEntry | null; onClose: () => void }) {
  const addEntry    = useStore((s) => s.addVaultEntry);
  const updateEntry = useStore((s) => s.updateVaultEntry);
  const { toast }   = useToast();

  const [form, setForm] = useState({
    category: entry?.category ?? 'login' as VaultCategory,
    title:    entry?.title ?? '',
    username: entry?.username ?? '',
    password: entry?.password ?? '',
    url:      entry?.url ?? '',
    notes:    entry?.notes ?? '',
    favorite: entry?.favorite ?? false,
  });
  const [showPw, setShowPw]   = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { toast('Add a title first', 'error'); return; }
    setBusy(true);
    if (entry) { await updateEntry(entry.id, form); toast('Item updated'); }
    else { await addEntry(form); toast('Item saved & encrypted'); }
    setBusy(false);
    onClose();
  };

  const strength = passwordStrength(form.password);

  return (
    <div className="vault-modal-overlay" onClick={onClose}>
      <div className="vault-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vault-modal-header">
          <span>{entry ? 'Edit item' : 'New item'}</span>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div className="vault-modal-body">
          {/* Category */}
          <label className="vault-field-label">Category</label>
          <div className="vault-cat-picker">
            {(Object.keys(CATEGORY_META) as VaultCategory[]).map((cat) => (
              <button
                key={cat}
                className={`vault-cat-chip ${form.category === cat ? 'active' : ''}`}
                onClick={() => set('category', cat)}
                style={form.category === cat ? { borderColor: CATEGORY_META[cat].color, color: CATEGORY_META[cat].color } : {}}
              >
                {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>

          <label className="vault-field-label">Title *</label>
          <input className="vault-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. GitHub, Chase Bank" autoFocus />

          <label className="vault-field-label">Username / Email</label>
          <input className="vault-input" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="username or email" />

          <label className="vault-field-label">Password</label>
          <div className="vault-pw-row">
            <input
              className="vault-input"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="••••••••"
              style={{ fontFamily: showPw ? 'var(--font-mono)' : 'inherit' }}
            />
            <button className="vault-icon-btn" onClick={() => setShowPw((v) => !v)} title={showPw ? 'Hide' : 'Show'}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button className="vault-icon-btn" onClick={() => { copyToClipboard(form.password); toast('Copied'); }} title="Copy">
              <Copy size={15} />
            </button>
            <button className="vault-icon-btn" onClick={() => setGenOpen((v) => !v)} title="Generate password">
              <RefreshCw size={15} />
            </button>
          </div>
          {form.password && (
            <div className="vault-strength" style={{ marginTop: 6 }}>
              <div className="vault-strength-bar">
                <div className={`vault-strength-fill s${strength.score}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
              </div>
              <span className="vault-strength-label">{strength.label}</span>
            </div>
          )}
          {genOpen && <PasswordGenerator onUse={(pw) => { set('password', pw); setShowPw(true); setGenOpen(false); }} />}

          <label className="vault-field-label">Website URL</label>
          <input className="vault-input" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" />

          <label className="vault-field-label">Notes</label>
          <textarea className="vault-input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Secure notes…" style={{ resize: 'none' }} />

          <label className="vault-checkbox-row">
            <input type="checkbox" checked={form.favorite} onChange={(e) => set('favorite', e.target.checked)} />
            <Star size={13} /> Mark as favorite
          </label>
        </div>

        <div className="vault-modal-footer">
          <button className="settings-btn secondary" onClick={onClose}>Cancel</button>
          <button className="vault-primary-btn" style={{ margin: 0, width: 'auto', padding: '8px 18px' }} disabled={busy} onClick={save}>
            {busy ? 'Encrypting…' : entry ? 'Save changes' : 'Save & encrypt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Password generator ───────────────────────────────────────────────────────

function PasswordGenerator({ onUse }: { onUse: (pw: string) => void }) {
  const [opts, setOpts] = useState<PwGenOptions>({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [pw, setPw]     = useState(() => generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true }));
  const { toast } = useToast();

  const regen = (next: PwGenOptions) => { setOpts(next); setPw(generatePassword(next)); };

  return (
    <div className="vault-generator">
      <div className="vault-gen-output">
        <code>{pw}</code>
        <button className="vault-icon-btn" onClick={() => setPw(generatePassword(opts))} title="Regenerate"><RefreshCw size={13} /></button>
        <button className="vault-icon-btn" onClick={() => { copyToClipboard(pw); toast('Copied'); }} title="Copy"><Copy size={13} /></button>
      </div>
      <div className="vault-gen-controls">
        <label className="vault-gen-length">
          Length: <strong>{opts.length}</strong>
          <input type="range" min={8} max={48} value={opts.length} onChange={(e) => regen({ ...opts, length: Number(e.target.value) })} />
        </label>
        <div className="vault-gen-toggles">
          {([['uppercase', 'A-Z'], ['lowercase', 'a-z'], ['numbers', '0-9'], ['symbols', '!@#']] as const).map(([k, label]) => (
            <label key={k} className="vault-gen-toggle">
              <input type="checkbox" checked={opts[k]} onChange={(e) => regen({ ...opts, [k]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <button className="vault-gen-use" onClick={() => onUse(pw)}>Use this password</button>
    </div>
  );
}
