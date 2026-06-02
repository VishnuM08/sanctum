import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toggle } from '../components/Toggle';
import { ThemeSelector } from '../components/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Settings as SettingsType } from '../types';
import { User, Bell, Lock, Sparkles, Moon, Sun, Shield, Download, Upload, Trash, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { exportData, importData } from '../utils/exportImport';
import { downloadJSON } from '../utils/exportPage';
import { NotionPage } from '../types/blocks';
import { useState as useReactState } from 'react';

export function Settings() {
  const { mode, toggleMode } = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useReactState(false);
  const [pages] = useLocalStorage<NotionPage[]>('notion-pages', []);
  const [settings, setSettings] = useLocalStorage<SettingsType>('settings', {
    notifications: {
      morningDigest: true,
      reminders: true,
      expiryWarnings: true,
    },
    ai: {
      autoExtractReminders: true,
      generateSummaries: true,
      suggestTags: true,
      model: 'haiku',
    },
  });

  const updateNotification = (key: keyof SettingsType['notifications'], value: boolean) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    });
  };

  const updateAI = (key: keyof SettingsType['ai'], value: any) => {
    setSettings({
      ...settings,
      ai: { ...settings.ai, [key]: value },
    });
  };

  const handleExport = () => {
    exportData();
    toast.success('Data exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importData(file)
      .then(() => {
        toast.success('Data imported successfully');
        window.location.reload();
      })
      .catch(() => {
        toast.error('Failed to import data');
      });
  };

  const handleClearAll = () => {
    localStorage.clear();
    toast.success('All data cleared');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">Profile</h3>
        </div>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-in bounce-in">
              <span className="text-3xl font-semibold text-primary">U</span>
            </div>
            <Button variant="outline" size="sm">Change Photo</Button>
          </div>
          <Input label="Name" defaultValue="User" />
          <Input label="Email" type="email" defaultValue="user@example.com" />
          <Button>Save Changes</Button>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            {mode === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          </div>
          <h3 className="font-semibold">Appearance</h3>
        </div>
        <div className="space-y-6">
          <Toggle
            enabled={mode === 'dark'}
            onChange={toggleMode}
            label="Dark Mode"
            description="Toggle between light and dark theme"
          />

          <div className="pt-4 border-t border-border">
            <ThemeSelector />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="space-y-4">
          <Toggle
            enabled={settings.notifications.morningDigest}
            onChange={(value) => updateNotification('morningDigest', value)}
            label="Morning Digest"
            description="Receive daily summary at 7:00 AM"
          />

          <Toggle
            enabled={settings.notifications.reminders}
            onChange={(value) => updateNotification('reminders', value)}
            label="Reminder Notifications"
            description="Push notifications for reminders"
          />

          <Toggle
            enabled={settings.notifications.expiryWarnings}
            onChange={(value) => updateNotification('expiryWarnings', value)}
            label="Expiry Warnings"
            description="Alert when vault items are expiring"
          />
        </div>
      </Card>

      {/* AI Agent */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">AI Agent Settings</h3>
        </div>
        <div className="space-y-4">
          <Toggle
            enabled={settings.ai.autoExtractReminders}
            onChange={(value) => updateAI('autoExtractReminders', value)}
            label="Auto-Extract Reminders"
            description="Automatically create reminders from notes"
          />

          <Toggle
            enabled={settings.ai.generateSummaries}
            onChange={(value) => updateAI('generateSummaries', value)}
            label="Generate Summaries"
            description="AI-powered note summaries"
          />

          <Toggle
            enabled={settings.ai.suggestTags}
            onChange={(value) => updateAI('suggestTags', value)}
            label="Suggest Tags"
            description="Auto-tag notes based on content"
          />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">AI Model</label>
            <select
              value={settings.ai.model}
              onChange={(e) => updateAI('model', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="haiku">Claude Haiku (Fast & Efficient)</option>
              <option value="sonnet">Claude Sonnet (Balanced)</option>
              <option value="opus">Claude Opus (Most Capable)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-green-500/10">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold">Security</h3>
        </div>
        <div className="space-y-5">
          <div>
            <h4 className="font-medium mb-4">Change Password</h4>
            <div className="space-y-4">
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <Button>Update Password</Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">Data Management</h3>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Export Data</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your notes, vault items, and reminders as a JSON file
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export All Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadJSON(pages, 'notion-pages-backup.json');
                  toast.success(`${pages.length} pages exported!`);
                }}
                disabled={pages.length === 0}
              >
                <FileText className="w-4 h-4" />
                Export Pages Only ({pages.length})
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-medium mb-2">Import Data</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Restore your data from a previously exported file
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button variant="outline" size="sm" as="span">
                <Upload className="w-4 h-4" />
                Import Data
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <Badge variant="danger">Caution</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Irreversible actions that affect your data
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash className="w-4 h-4" />
              Clear All Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Clear Data Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        description="This will permanently delete all your notes, vault items, reminders, and settings. This action cannot be undone. Make sure to export your data first if you want to keep it."
        confirmText="Clear Everything"
        variant="destructive"
      />
    </div>
  );
}
