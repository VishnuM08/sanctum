import { useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { VaultEntry } from '../types';
import { Plus, Search, Lock, Eye, EyeOff, Copy, CreditCard, Key, Phone, X, Shield, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { encrypt, decrypt } from '../utils/encryption';

export function Vault() {
  const [entries, setEntries] = useLocalStorage<VaultEntry[]>('vault', []);
  const [showAdd, setShowAdd] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'password' as VaultEntry['type'],
    value: '',
    expiresAt: '',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.title.trim() || !formData.value.trim()) return;

    const newEntry: VaultEntry = {
      id: Date.now().toString(),
      ...formData,
      value: encrypt(formData.value), // Encrypt the value
      expiresAt: formData.expiresAt || undefined,
      createdAt: new Date().toISOString(),
    };

    setEntries([newEntry, ...entries]);
    setFormData({ title: '', type: 'password', value: '', expiresAt: '' });
    setShowAdd(false);
    toast.success('Item added to vault');
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success('Item removed from vault');
  };

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedIds);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }
    setRevealedIds(newRevealed);
  };

  const handleCopy = async (value: string, id: string) => {
    try {
      const decrypted = decrypt(value);
      await navigator.clipboard.writeText(decrypted);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'password': return Key;
      case 'card': return CreditCard;
      case 'contact': return Phone;
      default: return Lock;
    }
  };

  const formatDate = (date: string) => {
    const expiryDate = new Date(date);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Expired';
    if (days < 7) return `${days} days left`;
    return expiryDate.toLocaleDateString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Secure Vault
          </h1>
          <p className="text-muted-foreground">{entries.length} encrypted items</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Item
        </Button>
      </div>

      {/* Security Notice */}
      <Card className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 animate-in bounce-in">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-green-900 dark:text-green-100">256-bit AES Encryption</h4>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-sm text-green-700 dark:text-green-200">
              All vault items are encrypted locally before storage. Your encryption key never leaves your device.
            </p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vault..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>

      {/* Vault Entries */}
      {filteredEntries.length === 0 ? (
        <Card className="text-center py-12">
          <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">
            {searchQuery ? 'No items found' : 'Vault is empty'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Add your first encrypted item'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAdd(true)} size="sm">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry, index) => {
            const Icon = getIcon(entry.type);
            const isRevealed = revealedIds.has(entry.id);
            const isCopied = copiedId === entry.id;

            return (
              <Card
                key={entry.id}
                hover
                className="flex items-center gap-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold truncate">{entry.title}</h4>
                    {entry.expiresAt && (
                      <Badge variant="warning">
                        {formatDate(entry.expiresAt)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">
                    {isRevealed ? decrypt(entry.value) : '••••••••••••'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleReveal(entry.id)}
                    className="p-2.5 rounded-xl hover:bg-accent transition-all active:scale-95"
                    title={isRevealed ? 'Hide' : 'Reveal'}
                  >
                    {isRevealed ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy(entry.value, entry.id)}
                    className="p-2.5 rounded-xl hover:bg-accent transition-all active:scale-95"
                    title="Copy"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(entry.id)}
                    className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-all active:scale-95"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowAdd(false)}
        >
          <Card className="w-full max-w-md animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Add Vault Item</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <Input
                label="Title"
                placeholder="e.g., Netflix Password"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VaultEntry['type'] })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="password">Password</option>
                  <option value="card">Credit Card</option>
                  <option value="contact">Contact</option>
                  <option value="note">Secure Note</option>
                </select>
              </div>

              <Input
                label="Value"
                type="password"
                placeholder="Enter sensitive data..."
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />

              <Input
                label="Expiry Date (optional)"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />

              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Lock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1 text-green-900 dark:text-green-100">AES-256 Encryption</h4>
                  <p className="text-sm text-green-700 dark:text-green-200">
                    This data will be encrypted before storage
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={!formData.title.trim() || !formData.value.trim()}
                >
                  Add to Vault
                </Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Vault Item"
        description="Are you sure you want to delete this vault item? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
