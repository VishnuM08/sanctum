import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Reminder } from '../types';
import { Plus, Bell, Sparkles, Check, X, Clock, Trash2, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../utils/api';
import { clsx } from 'clsx';

export function Reminders() {
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    context: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCloudData = async () => {
    if (!api.isOnline()) return;
    setLoading(true);
    try {
      const cloudReminders = await api.getReminders();
      setReminders(cloudReminders);
    } catch (err) {
      toast.error('Failed to sync reminders with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  const activeReminders = reminders.filter(r => !r.fired);
  const completedReminders = reminders.filter(r => r.fired);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);
  
  const gridCells: { day: number; date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    gridCells.push({ 
      day: d, 
      date: new Date(year, month - 1, d), 
      isCurrentMonth: false 
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({ 
      day: d, 
      date: new Date(year, month, d), 
      isCurrentMonth: true 
    });
  }

  // Next month padding days
  const totalCells = gridCells.length > 35 ? 42 : 35;
  const remaining = totalCells - gridCells.length;
  for (let d = 1; d <= remaining; d++) {
    gridCells.push({ 
      day: d, 
      date: new Date(year, month + 1, d), 
      isCurrentMonth: false 
    });
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getRemindersForDate = (date: Date) => {
    return reminders.filter(r => {
      try {
        if (r.remindAt.includes('at')) {
          const dStr = new Date(date).toLocaleDateString();
          return r.remindAt.includes(dStr);
        }
        const rDate = new Date(r.remindAt);
        return rDate.getDate() === date.getDate() &&
               rDate.getMonth() === date.getMonth() &&
               rDate.getFullYear() === date.getFullYear();
      } catch {
        return false;
      }
    });
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const remindersOnSelectedDate = getRemindersForDate(selectedDate);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.date || !formData.time) return;

    // Build standard date/time string
    const remindAtStr = `${formData.date}T${formData.time}:00`;

    if (api.isOnline()) {
      setLoading(true);
      try {
        const created = await api.createReminder(
          formData.title,
          remindAtStr,
          formData.context || undefined
        );
        setReminders([created, ...reminders]);
        setFormData({ title: '', date: '', time: '', context: '' });
        setShowAdd(false);
        toast.success('Reminder created on server');
      } catch (err: any) {
        toast.error('Failed to create reminder on server');
      } finally {
        setLoading(false);
      }
    } else {
      // LocalStorage mode
      const remindAtDisplay = `${new Date(formData.date).toLocaleDateString()} at ${formData.time}`;
      const newReminder: Reminder = {
        id: Date.now().toString(),
        title: formData.title,
        remindAt: remindAtDisplay,
        context: formData.context || undefined,
        aiGenerated: false,
        fired: false,
        createdAt: new Date().toISOString(),
      };

      setReminders([newReminder, ...reminders]);
      setFormData({ title: '', date: '', time: '', context: '' });
      setShowAdd(false);
      toast.success('Reminder created');
    }
  };

  const handleComplete = async (id: string) => {
    if (api.isOnline()) {
      setLoading(true);
      try {
        const updated = await api.completeReminder(id);
        setReminders(reminders.map(r => r.id === id ? updated : r));
        toast.success('Reminder marked complete');
      } catch (err: any) {
        toast.error('Failed to update reminder status');
      } finally {
        setLoading(false);
      }
    } else {
      setReminders(reminders.map(r =>
        r.id === id ? { ...r, fired: true } : r
      ));
      toast.success('Reminder completed');
    }
  };

  const handleDelete = async (id: string) => {
    if (api.isOnline()) {
      setLoading(true);
      try {
        await api.deleteReminder(id);
        setReminders(reminders.filter(r => r.id !== id));
        toast.success('Reminder deleted');
      } catch (err: any) {
        toast.error('Failed to delete reminder');
      } finally {
        setLoading(false);
        setDeleteConfirm(null);
      }
    } else {
      setReminders(reminders.filter(r => r.id !== id));
      setDeleteConfirm(null);
      toast.success('Reminder deleted');
    }
  };

  const formatRemindAt = (dateStr: string) => {
    try {
      // Check if it's ISO string or manual text representation
      if (dateStr.includes('at') || dateStr.includes('week') || dateStr.includes('Tomorrow')) {
        return dateStr;
      }
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Reminders
            </h1>
            {loading && <RefreshCw className="w-5 h-5 text-primary animate-spin" />}
          </div>
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

      {/* View Mode & Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
        <div className="segmented-control">
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              "segmented-control-item cursor-pointer",
              viewMode === 'list' && "active"
            )}
          >
            <Clock className="w-3.5 h-3.5 mr-1 inline" />
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={clsx(
              "segmented-control-item cursor-pointer",
              viewMode === 'calendar' && "active"
            )}
          >
            <Calendar className="w-3.5 h-3.5 mr-1 inline" />
            Calendar View
          </button>
        </div>

        {viewMode === 'list' && (
          <div className="segmented-control">
            <button
              onClick={() => setActiveTab('active')}
              className={clsx(
                "segmented-control-item cursor-pointer",
                activeTab === 'active' && "active"
              )}
            >
              Active ({activeReminders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={clsx(
                "segmented-control-item cursor-pointer",
                activeTab === 'completed' && "active"
              )}
            >
              Completed ({completedReminders.length})
            </button>
          </div>
        )}
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Calendar Grid Card */}
          <Card className="md:col-span-2 p-6 animate-in slide-in-up duration-300">
            {/* Header: Month and navigation */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                {months[month]} {year}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/40 hover:text-foreground cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/40 hover:text-foreground cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays names */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {gridCells.map((cell, idx) => {
                const cellReminders = getRemindersForDate(cell.date);
                const hasReminders = cellReminders.length > 0;
                const hasActive = cellReminders.some(r => !r.fired);
                const isSelected = selectedDate.getDate() === cell.date.getDate() &&
                                   selectedDate.getMonth() === cell.date.getMonth() &&
                                   selectedDate.getFullYear() === cell.date.getFullYear();
                const isToday = new Date().getDate() === cell.date.getDate() &&
                                new Date().getMonth() === cell.date.getMonth() &&
                                new Date().getFullYear() === cell.date.getFullYear();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(cell.date)}
                    className={clsx(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 relative border transition-all active:scale-95 cursor-pointer text-xs font-medium",
                      !cell.isCurrentMonth && "text-muted-foreground/35 border-transparent hover:bg-secondary/10",
                      cell.isCurrentMonth && !isSelected && "text-foreground border-transparent hover:bg-secondary/60",
                      isSelected && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20",
                      isToday && !isSelected && "border-primary/50 text-primary font-bold bg-primary/5"
                    )}
                  >
                    <span>{cell.day}</span>
                    {hasReminders && (
                      <span className={clsx(
                        "w-1.5 h-1.5 rounded-full mt-1.5 transition-colors absolute bottom-2",
                        isSelected 
                          ? "bg-primary-foreground" 
                          : hasActive 
                            ? "bg-primary" 
                            : "bg-muted-foreground/50"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Side List Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wide uppercase text-muted-foreground mb-3 px-1">
              Reminders on {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>

            {remindersOnSelectedDate.length === 0 ? (
              <Card className="py-12 text-center border-dashed border-border/60">
                <Bell className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No reminders for this day</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {remindersOnSelectedDate.map((reminder) => (
                  <Card key={reminder.id} className="p-4 flex items-start gap-3 relative group">
                    <div className={clsx(
                      "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                      reminder.fired 
                        ? "bg-green-500/10" 
                        : reminder.aiGenerated 
                          ? "bg-primary/10" 
                          : "bg-orange-500/10"
                    )}>
                      {reminder.fired ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Bell className={clsx("w-4 h-4", reminder.aiGenerated ? "text-primary" : "text-orange-500")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={clsx(
                        "text-xs font-semibold truncate",
                        reminder.fired && "line-through text-muted-foreground"
                      )}>
                        {reminder.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRemindAt(reminder.remindAt)}
                      </p>
                    </div>
                    {!reminder.fired && (
                      <button
                        onClick={() => handleComplete(reminder.id)}
                        className="p-1 rounded-lg hover:bg-green-500/15 text-green-600 cursor-pointer"
                        title="Complete"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        activeTab === 'active' ? (
          <div>
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
              <div className="space-y-4 animate-in fade-in duration-300">
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
                        <span>{formatRemindAt(reminder.remindAt)}</span>
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
                        className="p-2.5 rounded-xl hover:bg-green-500/10 text-green-600 transition-all active:scale-95 cursor-pointer"
                        title="Mark complete"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(reminder.id)}
                        className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-all active:scale-95 cursor-pointer"
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
        ) : (
          <div>
            {completedReminders.length === 0 ? (
              <Card className="text-center py-12">
                <Check className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No completed reminders</h3>
                <p className="text-sm text-muted-foreground">
                  When you complete reminders, they will appear here.
                </p>
              </Card>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                {completedReminders.map((reminder, index) => (
                  <Card 
                    key={reminder.id} 
                    className="flex items-center gap-4 opacity-75"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold line-through text-muted-foreground">{reminder.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setDeleteConfirm(reminder.id)}
                        className="p-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-all active:scale-95 cursor-pointer"
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
        )
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
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
                  className="w-full h-24 px-4 py-3 rounded-xl focus:outline-none resize-none glass-input"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={loading || !formData.title.trim() || !formData.date || !formData.time}
                >
                  {loading ? 'Creating...' : 'Create Reminder'}
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
