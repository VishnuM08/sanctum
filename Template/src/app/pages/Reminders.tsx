import { useState } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Reminder } from '../types';
import { Plus, Bell, Sparkles, Check, X, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function Reminders() {
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    context: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeReminders = reminders.filter(r => !r.fired);
  const completedReminders = reminders.filter(r => r.fired);

  const handleSave = () => {
    if (!formData.title.trim() || !formData.date || !formData.time) return;

    const remindAt = `${new Date(formData.date).toLocaleDateString()} at ${formData.time}`;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: formData.title,
      remindAt,
      context: formData.context || undefined,
      aiGenerated: false,
      fired: false,
      createdAt: new Date().toISOString(),
    };

    setReminders([newReminder, ...reminders]);
    setFormData({ title: '', date: '', time: '', context: '' });
    setShowAdd(false);
    toast.success('Reminder created');
  };

  const handleComplete = (id: string) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, fired: true } : r
    ));
    toast.success('Reminder completed');
  };

  const handleDelete = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    toast.success('Reminder deleted');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Reminders
          </h1>
          <p className="text-muted-foreground">{activeReminders.length} active reminders</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Reminder
        </Button>
      </div>

      {/* AI Agent Info */}
      <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 animate-in bounce-in">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">AI-Powered Reminders</h4>
              <Badge variant="primary">Smart</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              The AI agent automatically extracts reminders from your notes. When a reminder fires, you'll see the full context from the original note.
            </p>
          </div>
        </div>
      </Card>

      {/* Active Reminders */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-lg">Active</h3>
          <Badge variant="primary">{activeReminders.length}</Badge>
        </div>

        {activeReminders.length === 0 ? (
          <Card className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No active reminders</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a reminder or let the AI extract them from your notes
            </p>
            <Button onClick={() => setShowAdd(true)} size="sm">
              <Plus className="w-4 h-4" />
              Add Reminder
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeReminders.map((reminder, index) => (
              <Card
                key={reminder.id}
                hover
                className="flex items-start gap-4 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  reminder.aiGenerated
                    ? 'bg-gradient-to-br from-primary/20 to-primary/10'
                    : 'bg-gradient-to-br from-orange-500/20 to-orange-500/10'
                }`}>
                  <Bell className={`w-6 h-6 ${reminder.aiGenerated ? 'text-primary' : 'text-orange-600'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold">{reminder.title}</h4>
                    {reminder.aiGenerated && <Badge variant="primary">AI</Badge>}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{reminder.remindAt}</span>
                  </div>

                  {reminder.context && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-accent/50 border border-border">
                      <p className="text-xs text-muted-foreground">{reminder.context}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleComplete(reminder.id)}
                    className="p-2.5 rounded-xl hover:bg-green-500/10 text-green-600 transition-all active:scale-95"
                    title="Mark complete"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(reminder.id)}
                    className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-all active:scale-95"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-lg">Completed</h3>
            <Badge variant="default">{completedReminders.length}</Badge>
          </div>
          <div className="space-y-3 opacity-60">
            {completedReminders.slice(0, 3).map((reminder) => (
              <Card key={reminder.id} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm line-through">{reminder.title}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowAdd(false)}
        >
          <Card className="w-full max-w-md animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Add Reminder</h3>
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
                placeholder="What do you want to be reminded about?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                <Input
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Context (optional)</label>
                <textarea
                  placeholder="Add additional context or notes..."
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  className="w-full h-24 px-4 py-3 rounded-xl border-2 border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={!formData.title.trim() || !formData.date || !formData.time}
                >
                  Create Reminder
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
        title="Delete Reminder"
        description="Are you sure you want to delete this reminder?"
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
