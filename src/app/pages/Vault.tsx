import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { VaultEntry } from '../types';
import { Plus, Search, Lock, Eye, EyeOff, Copy, CreditCard, Key, Phone, X, Shield, Trash2, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { encrypt, decrypt } from '../utils/encryption';
import { encryptData, decryptData } from '../utils/crypto';
import { api } from '../utils/api';

export function Vault() {
  const [entries, setEntries] = useLocalStorage<VaultEntry[]>('vault', []);
  const [showAdd, setShowAdd] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [scrambledValues, setScrambledValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'password' as VaultEntry['type'],
    value: '',
    expiresAt: '',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cryptographic lock states for offline mode
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(api.isOnline());
  const [verificationText, setVerificationText] = useLocalStorage<string>('vault-verification', '');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const fetchCloudData = async () => {
    if (!api.isOnline()) return;
    setLoading(true);
    try {
      const cloudEntries = await api.getVaultEntries();
      setEntries(cloudEntries);
    } catch (err) {
      toast.error('Failed to sync vault items with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setLoading(true);
    try {
      const decrypted = await decryptData(verificationText, passwordInput);
      if (decrypted === 'sanctum-verified') {
        setMasterPassword(passwordInput);
        setIsUnlocked(true);
        toast.success('Sanctum unlocked successfully');
      } else {
        toast.error('Incorrect master password');
      }
    } catch (err) {
      toast.error('Incorrect master password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput || !confirmPasswordInput) return;
    if (passwordInput !== confirmPasswordInput) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordInput.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const verification = await encryptData('sanctum-verified', passwordInput);
      setVerificationText(verification);
      
      // Migrate old XOR items if there are any
      if (entries.length > 0) {
        const migrated = await Promise.all(
          entries.map(async (entry) => {
            let plainVal = '';
            try {
              plainVal = decrypt(entry.value); // Decrypt using XOR
            } catch {
              plainVal = entry.value;
            }
            const cipherVal = await encryptData(plainVal, passwordInput);
            return { ...entry, value: cipherVal };
          })
        );
        setEntries(migrated);
        toast.success(`Migrated ${entries.length} vault entries to AES-256 GCM`);
      }

      setMasterPassword(passwordInput);
      setIsUnlocked(true);
      toast.success('Master password set up successfully');
    } catch (err) {
      toast.error('Failed to set up encryption keys');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startDecryptAnimation = (value: string, id: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=-{}[]|';
    let iterations = 0;
    const interval = setInterval(() => {
      const scrambled = value
        .split('')
        .map((char, index) => {
          if (index < iterations) {
            return value[index];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      
      setScrambledValues(prev => ({ ...prev, [id]: scrambled }));
      
      if (iterations >= value.length) {
        clearInterval(interval);
        setDecryptedValues(prev => ({ ...prev, [id]: value }));
        setScrambledValues(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      iterations += 1 / 3; // speed of resolution
    }, 25);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.value.trim()) return;

    if (api.isOnline()) {
      setLoading(true);
      try {
        const created = await api.createVaultEntry(
          formData.title,
          formData.type,
          formData.value, // Send plaintext, backend will encrypt via AES-256
          formData.expiresAt
        );
        created.value = formData.value;
        setEntries([created, ...entries]);
        setShowAdd(false);
        setFormData({ title: '', type: 'password', value: '', expiresAt: '' });
        toast.success('Item added to secure cloud vault');
      } catch (err: any) {
        toast.error('Failed to save item to cloud');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const cipherVal = await encryptData(formData.value, masterPassword);
        const newEntry: VaultEntry = {
          id: Date.now().toString(),
          ...formData,
          value: cipherVal,
          expiresAt: formData.expiresAt || undefined,
          createdAt: new Date().toISOString(),
        };

        setEntries([newEntry, ...entries]);
        setFormData({ title: '', type: 'password', value: '', expiresAt: '' });
        setShowAdd(false);
        toast.success('Item added to local vault');
      } catch {
        toast.error('Failed to encrypt and save item');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (api.isOnline()) {
      setLoading(true);
      try {
        await api.deleteVaultEntry(id);
        setEntries(entries.filter(e => e.id !== id));
        toast.success('Item removed from cloud vault');
      } catch (err: any) {
        toast.error('Failed to delete item from cloud');
      } finally {
        setLoading(false);
        setDeleteConfirm(null);
      }
    } else {
      setEntries(entries.filter(e => e.id !== id));
      setDeleteConfirm(null);
      toast.success('Item removed from vault');
    }
  };

  const toggleReveal = async (id: string, rawValue: string) => {
    const newRevealed = new Set(revealedIds);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
      setRevealedIds(newRevealed);
      setDecryptedValues(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      newRevealed.add(id);
      setRevealedIds(newRevealed);
      
      let decrypted = '';
      try {
        decrypted = api.isOnline() ? rawValue : await decryptData(rawValue, masterPassword);
      } catch {
        decrypted = 'Decryption failed';
      }
      startDecryptAnimation(decrypted, id);
    }
  };

  const handleCopy = async (value: string, id: string) => {
    try {
      const decrypted = api.isOnline() ? value : await decryptData(value, masterPassword);
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

  if (!isUnlocked && !api.isOnline()) {
    const hasVerification = !!verificationText;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border border-border bg-card/60 backdrop-blur-xl shadow-2xl animate-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {hasVerification ? 'Unlock Secure Sanctum' : 'Set Up Sanctum Key'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {hasVerification 
                ? 'Enter your master password to decrypt your local vault.' 
                : 'Create a local master password to encrypt your vault. This password is never sent to any server.'}
            </p>
          </div>

          <form onSubmit={hasVerification ? handleUnlock : handleSetup} className="space-y-4">
            <Input
              label="Master Password"
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />

            {!hasVerification && (
              <Input
                label="Confirm Master Password"
                type="password"
                placeholder="••••••••"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                required
              />
            )}

            <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : hasVerification ? (
                'Unlock Vault'
              ) : (
                'Create Sanctum Key'
              )}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Secure Vault
            </h1>
            {loading && <RefreshCw className="w-5 h-5 text-primary animate-spin" />}
          </div>
          <p className="text-muted-foreground">{entries.length} encrypted items</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isUnlocked && !api.isOnline() && (
            <Button
              variant="outline"
              onClick={() => {
                setMasterPassword('');
                setIsUnlocked(false);
                setPasswordInput('');
                setDecryptedValues({});
                setRevealedIds(new Set());
                toast.info('Vault locked');
              }}
              className="flex-grow sm:flex-grow-0"
            >
              <Lock className="w-4 h-4" />
              Lock Vault
            </Button>
          )}
          <Button onClick={() => setShowAdd(true)} className="flex-grow sm:flex-grow-0">
            <Plus className="w-5 h-5" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 animate-in bounce-in">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                {api.isOnline() ? 'Server-Side AES-256 Encryption' : 'Local 256-bit AES Encryption'}
              </h4>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-sm text-green-700 dark:text-green-200">
              {api.isOnline() 
                ? 'All vault items are encrypted securely on the server using AES-256 block ciphers before writing to disk.'
                : 'All vault items are encrypted locally before storage. Your encryption key never leaves your device.'}
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
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none shadow-sm glass-input"
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
            const isScrambling = scrambledValues[entry.id] !== undefined;

            return (
              <Card
                key={entry.id}
                hover
                className="flex items-center gap-4 animate-in slide-in-up duration-300"
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
                    {/* Render decryption scramble animation dynamically */}
                    {isScrambling 
                      ? scrambledValues[entry.id]
                      : isRevealed 
                        ? (decryptedValues[entry.id] || '••••••••••••')
                        : '••••••••••••'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleReveal(entry.id, entry.value)}
                    className="p-2.5 rounded-xl hover:bg-accent transition-all active:scale-95 cursor-pointer"
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
                    className="p-2.5 rounded-xl hover:bg-accent transition-all active:scale-95 cursor-pointer"
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
                    className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-all active:scale-95 cursor-pointer"
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
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
                  className="w-full px-4 py-2.5 rounded-xl focus:outline-none glass-input"
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
                  <h4 className="text-sm font-medium mb-1 text-green-900 dark:text-green-100">
                    {api.isOnline() ? 'AES-256 Server Encryption' : 'AES-256 Local Encryption'}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-200">
                    This data will be encrypted securely before saving
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={loading || !formData.title.trim() || !formData.value.trim()}
                >
                  {loading ? 'Adding...' : 'Add to Vault'}
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
