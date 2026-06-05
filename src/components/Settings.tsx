import { useState } from 'react';
import {
  User, Bell, Link, Building, Users, CreditCard,
  Shield, Sun, Moon, Monitor, Eye, EyeOff, ArrowLeft
} from 'lucide-react';
import { useStore } from '../store';
import { api } from '../utils/api';
import type { SettingsSection } from '../types';

interface Props {
  section: SettingsSection;
}

const NAV_ITEMS: { section: SettingsSection; label: string; icon: React.ReactNode; group: string }[] = [
  { section: 'account',       label: 'My Account',      icon: <User size={14} />,        group: 'Account' },
  { section: 'notifications', label: 'Notifications',   icon: <Bell size={14} />,        group: 'Account' },
  { section: 'connections',   label: 'Connections',     icon: <Link size={14} />,        group: 'Account' },
  { section: 'workspace',     label: 'General',         icon: <Building size={14} />,    group: 'Workspace' },
  { section: 'members',       label: 'Members & guests',icon: <Users size={14} />,       group: 'Workspace' },
  { section: 'billing',       label: 'Billing',         icon: <CreditCard size={14} />,  group: 'Workspace' },
  { section: 'security',      label: 'Security',        icon: <Shield size={14} />,      group: 'Workspace' },
];

export function Settings({ section: initialSection }: Props) {
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const workspace = useStore((s) => s.workspace);
  const updateWorkspace = useStore((s) => s.updateWorkspace);
  const user = useStore((s) => s.user);
  const navigateToSettings = useStore((s) => s.navigateToSettings);
  const viewHistory = useStore((s) => s.viewHistory);
  const navigate = useStore((s) => s.navigate);

  const goBack = () => {
    if (viewHistory.length > 0) {
      const lastView = viewHistory[viewHistory.length - 1];
      useStore.setState((s) => ({
        activeView: lastView,
        viewHistory: s.viewHistory.slice(0, -1),
      }));
    } else {
      navigate({ type: 'home' });
    }
  };

  const groups = ['Account', 'Workspace'];

  return (
    <div className="settings-layout-container">
      {/* Mobile Settings Header */}
      <div className="settings-mobile-header">
        <button className="settings-back-btn" onClick={goBack} title="Back">
          <ArrowLeft size={18} />
        </button>
        <span className="settings-header-title">Settings</span>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {groups.map((group) => (
            <div key={group} style={{ display: 'contents' }}>
              <div className="settings-section-label">{group}</div>
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                <button
                  key={item.section}
                  className={`settings-nav-item ${section === item.section ? 'active' : ''}`}
                  onClick={() => { setSection(item.section); navigateToSettings(item.section); }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
        {section === 'account' && (
          <AccountSection user={user} settings={settings} updateSettings={updateSettings} />
        )}
        {section === 'notifications' && <NotificationsSection />}
        {section === 'connections' && <ConnectionsSection />}
        {section === 'workspace' && (
          <WorkspaceSection workspace={workspace} updateWorkspace={updateWorkspace} />
        )}
        {section === 'members' && <MembersSection />}
        {section === 'billing' && <BillingSection />}
        {section === 'security' && <SecuritySection />}
      </div>
    </div>
  </div>
  );
}

// ── Account section ────────────────────────────────────────────────────────

function AccountSection({ user, settings, updateSettings }: {
  user: { name: string; email: string; avatar: string; color: string; id: string };
  settings: { theme: 'light' | 'dark' | 'system'; density?: string; typewriterMode?: boolean };
  updateSettings: (patch: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  return (
    <>
      <h1 className="settings-h1">My Account</h1>

      <h2 className="settings-h2">Profile</h2>

      <div className="settings-row">
        <div className="settings-row-label">
          <strong>Profile photo</strong>
          <span>Your photo or avatar</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user.avatar
            )}
          </div>
          <button className="settings-btn secondary">Upload photo</button>
        </div>
      </div>

      <div className="settings-row" style={{ flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 500, fontSize: 14 }}>Name</label>
        <input
          className="settings-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="settings-row" style={{ flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 500, fontSize: 14 }}>Email</label>
        <input
          className="settings-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="settings-btn primary">Save changes</button>
      </div>

      <h2 className="settings-h2">Appearance</h2>

      {/* Content density */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Content density</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Controls spacing and font size in the editor</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['compact', 'default', 'spacious'] as const).map((d) => (
            <button
              key={d}
              className={`settings-btn secondary ${settings.density === d ? 'active-density' : ''}`}
              style={{ flex: 1, fontWeight: settings.density === d ? 600 : 400, borderColor: settings.density === d ? 'var(--accent)' : 'var(--border-strong)', color: settings.density === d ? 'var(--accent)' : 'var(--text-muted)' }}
              onClick={() => updateSettings({ density: d })}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Typewriter mode */}
      <div className="settings-row" style={{ marginBottom: 16 }}>
        <div className="settings-row-label">
          <strong>Typewriter mode</strong>
          <span>Keeps the cursor vertically centered while typing</span>
        </div>
        <div className="settings-row-control">
          <label className="settings-toggle">
            <input type="checkbox" checked={settings.typewriterMode} onChange={(e) => updateSettings({ typewriterMode: e.target.checked })} />
            <span className="settings-toggle-slider" />
          </label>
        </div>
      </div>

      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Theme</div>
      <div className="theme-options">
        {([
          { value: 'light', label: 'Light', icon: <Sun size={20} /> },
          { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
          { value: 'system', label: 'System', icon: <Monitor size={20} /> },
        ] as const).map(({ value, label, icon }) => (
          <button
            key={value}
            className={`theme-option ${value === 'dark' ? 'dark-preview' : ''} ${settings.theme === value ? 'selected' : ''}`}
            onClick={() => updateSettings({ theme: value })}
          >
            <div className="theme-option-preview">
              <div className="theme-preview-sidebar" />
              <div className="theme-preview-content" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: value === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', fontSize: 20,
              }}>
                {icon}
              </div>
            </div>
            <div style={{ fontWeight: settings.theme === value ? 600 : 400 }}>{label}</div>
          </button>
        ))}
      </div>

      <h2 className="settings-h2">Password</h2>
      <div className="settings-row" style={{ flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 500, fontSize: 14 }}>Current password</label>
        <input className="settings-input" type="password" placeholder="Enter current password" />
      </div>
      <div className="settings-row" style={{ flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 500, fontSize: 14 }}>New password</label>
        <input className="settings-input" type="password" placeholder="Enter new password" />
      </div>
      <button className="settings-btn secondary" style={{ marginTop: 8 }}>Change password</button>

      <h2 className="settings-h2" style={{ marginTop: 40 }}>Session</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>Sign out</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Return to the landing page (your data stays saved)</div>
        </div>
        <button className="settings-btn secondary" onClick={() => useStore.getState().signOut()}>Sign out</button>
      </div>

      <h2 className="settings-h2" style={{ marginTop: 40 }}>Danger zone</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>Delete account</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Permanently delete your account and all data</div>
        </div>
        <button
          className="settings-btn danger"
          onClick={async () => {
            if (confirm('Permanently delete your account and all data? This cannot be undone.')) {
              try {
                await useStore.getState().deleteAccount();
              } catch (err: any) {
                alert(err.message || 'Failed to delete account');
              }
            }
          }}
        >
          Delete account
        </button>
      </div>
    </>
  );
}

// ── Notifications section ──────────────────────────────────────────────────

function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    email: true,
    push: false,
    mentions: true,
    comments: true,
    reminders: false,
  });

  return (
    <>
      <h1 className="settings-h1">Notifications</h1>
      <h2 className="settings-h2">Email notifications</h2>

      {[
        { key: 'email', label: 'Email notifications', desc: 'Receive notifications via email' },
        { key: 'push', label: 'Push notifications', desc: 'Browser and mobile push notifications' },
        { key: 'mentions', label: 'Mentions', desc: 'When someone @mentions you' },
        { key: 'comments', label: 'Comments', desc: 'When someone comments on your pages' },
        { key: 'reminders', label: 'Reminders', desc: 'Date-based reminders' },
      ].map(({ key, label, desc }) => (
        <div key={key} className="settings-row">
          <div className="settings-row-label">
            <strong>{label}</strong>
            <span>{desc}</span>
          </div>
          <div className="settings-row-control">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifs[key as keyof typeof notifs]}
                onChange={(e) => setNotifs((n) => ({ ...n, [key]: e.target.checked }))}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Connections section ────────────────────────────────────────────────────

function ConnectionsSection() {
  const integrations = [
    { name: 'GitHub', icon: '🐙', connected: false, desc: 'Link GitHub repos to pages' },
    { name: 'Google Drive', icon: '📁', connected: true, desc: 'Embed Google Docs and Sheets' },
    { name: 'Slack', icon: '💬', connected: false, desc: 'Get Slack notifications' },
    { name: 'Figma', icon: '🎨', connected: false, desc: 'Embed Figma designs' },
  ];

  const [serverUrl, setServerUrl] = useState(api.getApiBase());
  const [showUrl, setShowUrl] = useState(false);
  const [checking, setChecking] = useState(false);
  const isServerOnline = useStore((s) => s.isServerOnline);
  const setIsServerOnline = useStore((s) => s.setIsServerOnline);
  const syncWithBackend = useStore((s) => s.syncWithBackend);

  const handleUpdateServer = async () => {
    setChecking(true);
    try {
      api.setApiBase(serverUrl.trim());
      const online = await api.checkServer();
      setIsServerOnline(online);
      if (online) {
        await syncWithBackend();
        alert('Server URL updated successfully and connected!');
      } else {
        alert('Server URL saved, but the server is unreachable.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect to server');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <h1 className="settings-h1">Connections</h1>

      {/* Local AI status */}
      <h2 className="settings-h2">AI Assistant</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'var(--bg-hover)', marginBottom: 24, border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 28 }}>🤖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Local AI (Ollama)</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            AI writing, summaries, and action item extraction run privately on your own server via Ollama — no third-party API keys required.
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: isServerOnline ? '#4caf50' : '#f44336', background: isServerOnline ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          {isServerOnline ? '✓ Active' : '✗ Offline'}
        </span>
      </div>

      {/* Server Base URL Settings */}
      <h2 className="settings-h2">Backend Server URL</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', borderRadius: 8, background: 'var(--bg-hover)', marginBottom: 32, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Configure the API endpoint of your cloud server. This is masked by default for privacy.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <input
            type={showUrl ? 'text' : 'password'}
            className="settings-input"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="https://sanctum-api.theaignite.app"
            style={{ flex: 1, paddingRight: '40px' }}
          />
          <button
            type="button"
            onClick={() => setShowUrl(!showUrl)}
            style={{
              position: 'absolute',
              right: '90px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4
            }}
            title={showUrl ? 'Hide server URL' : 'Show server URL'}
          >
            {showUrl ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="settings-btn primary"
            onClick={handleUpdateServer}
            disabled={checking}
            style={{ whiteSpace: 'nowrap' }}
          >
            {checking ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>

      <h2 className="settings-h2">Other Integrations</h2>
      {integrations.map((int) => (
        <div key={int.name} className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <span style={{ fontSize: 28 }}>{int.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{int.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{int.desc}</div>
            </div>
          </div>
          <button className={`settings-btn ${int.connected ? 'secondary' : 'primary'}`}>
            {int.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      ))}
    </>
  );
}

// ── Workspace section ──────────────────────────────────────────────────────

function WorkspaceSection({ workspace, updateWorkspace }: {
  workspace: { name: string; icon: string; id: string; plan: string };
  updateWorkspace: (patch: Partial<{ name: string; icon: string }>) => void;
}) {
  const [name, setName] = useState(workspace.name);

  return (
    <>
      <h1 className="settings-h1">Workspace Settings</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          cursor: 'pointer',
        }}>
          {workspace.icon}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{workspace.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Free plan</div>
        </div>
      </div>

      <h2 className="settings-h2">General</h2>

      <div className="settings-row" style={{ flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 500, fontSize: 14 }}>Workspace name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="settings-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="settings-btn primary"
            onClick={() => updateWorkspace({ name })}
          >
            Save
          </button>
        </div>
      </div>

      <h2 className="settings-h2">Export</h2>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
        Export all your workspace content as a ZIP file containing Markdown files.
      </div>
      <button className="settings-btn secondary">Export workspace</button>

      <h2 className="settings-h2" style={{ marginTop: 40 }}>Danger zone</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>Delete workspace</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Permanently delete the workspace and all pages</div>
        </div>
        <button
          className="settings-btn danger"
          onClick={async () => {
            if (confirm('Permanently delete the entire workspace and all pages? This cannot be undone.')) {
              try {
                await useStore.getState().deleteWorkspace();
                alert('Workspace cleared successfully!');
              } catch (err: any) {
                alert(err.message || 'Failed to delete workspace');
              }
            }
          }}
        >
          Delete workspace
        </button>
      </div>
    </>
  );
}

// ── Members section ────────────────────────────────────────────────────────

function MembersSection() {
  const [email, setEmail] = useState('');
  const members = [
    { name: 'You', email: 'you@example.com', avatar: '🧑', role: 'Owner' },
    { name: 'Alice', email: 'alice@example.com', avatar: '👩', role: 'Member' },
    { name: 'Bob', email: 'bob@example.com', avatar: '👨', role: 'Member' },
  ];

  return (
    <>
      <h1 className="settings-h1">Members & Guests</h1>

      <h2 className="settings-h2">Invite members</h2>
      <div className="share-input-row" style={{ marginBottom: 24 }}>
        <input
          className="share-input"
          placeholder="Add by email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="settings-btn primary">Invite</button>
      </div>

      <h2 className="settings-h2">Members ({members.length})</h2>
      {members.map((m) => (
        <div key={m.email} className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{m.avatar}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="settings-input"
              value={m.role}
              style={{ width: 120, padding: '4px 8px' }}
              onChange={() => {}}
            >
              <option>Owner</option>
              <option>Member</option>
              <option>Guest</option>
            </select>
            {m.name !== 'You' && (
              <button className="settings-btn secondary" style={{ padding: '4px 12px' }}>
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ── Billing section ────────────────────────────────────────────────────────

function BillingSection() {
  return (
    <>
      <h1 className="settings-h1">Plans & Billing</h1>

      <div className="settings-active-plan-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Free Plan</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Current plan</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 24 }}>$0/mo</div>
        </div>
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
          Unlimited pages • 5 MB file uploads • 7-day version history
        </div>
      </div>

      {[
        { name: 'Plus', price: '$10', desc: 'For individuals who want unlimited blocks', features: ['Unlimited blocks', '5 GB uploads', '30-day history'] },
        { name: 'Business', price: '$18', desc: 'For teams with advanced tools', features: ['Everything in Plus', 'SAML SSO', 'Advanced analytics'] },
      ].map((plan) => (
        <div key={plan.name} className="settings-plan-card">
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{plan.desc}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {plan.features.map((f) => (
                <span key={f} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✓ {f}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{plan.price}/mo</div>
            <button className="settings-btn primary" style={{ marginTop: 8 }}>Upgrade</button>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Security section ───────────────────────────────────────────────────────

function SecuritySection() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  return (
    <>
      <h1 className="settings-h1">Security</h1>

      <h2 className="settings-h2">Two-factor authentication</h2>
      <div className="settings-row">
        <div className="settings-row-label">
          <strong>Two-factor authentication</strong>
          <span>Add an extra layer of security to your account</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={twoFAEnabled}
              onChange={(e) => setTwoFAEnabled(e.target.checked)}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>
      </div>

      <h2 className="settings-h2">Active sessions</h2>
      {[
        { device: 'Chrome on Windows', location: 'New York, US', time: 'Active now', icon: '💻' },
        { device: 'Safari on iPhone', location: 'New York, US', time: '2 hours ago', icon: '📱' },
      ].map((session, i) => (
        <div key={i} className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{session.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{session.device}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {session.location} · {session.time}
              </div>
            </div>
          </div>
          {i > 0 && (
            <button className="settings-btn danger" style={{ padding: '4px 12px' }}>
              Revoke
            </button>
          )}
        </div>
      ))}
    </>
  );
}
