import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, VaultEntry, Reminder } from '../types';
import { FileText, Lock, Bell, Sparkles, TrendingUp, Clock, ArrowRight, RefreshCw, Activity } from 'lucide-react';
import { api } from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded shadow text-xs font-medium space-y-1.5">
        <p className="text-muted-foreground mb-1 font-bold">{label} Activity</p>
        {payload.map((item: any) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: item.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-bold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [vault, setVault] = useLocalStorage<VaultEntry[]>('vault', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [loading, setLoading] = useState(false);

  const fetchCloudData = async () => {
    if (!api.isOnline()) return;
    setLoading(true);
    try {
      const [cloudNotes, cloudVault, cloudReminders] = await Promise.all([
        api.getNotes(),
        api.getVaultEntries(),
        api.getReminders()
      ]);
      setNotes(cloudNotes);
      setVault(cloudVault);
      setReminders(cloudReminders);
    } catch (err) {
      console.error('Failed to sync dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  const activeReminders = reminders.filter(r => !r.fired);
  const aiGeneratedCount = notes.filter(n => n.aiGenerated || n.aiSummary).length +
    reminders.filter(r => r.aiGenerated).length;

  // Generate last 7 days of activity data
  const activityData = (() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const notesCreated = notes.filter(n => n.createdAt && n.createdAt.startsWith(dateString)).length;
      const vaultCreated = vault.filter(v => v.createdAt && v.createdAt.startsWith(dateString)).length;
      const remindersCreated = reminders.filter(r => r.createdAt && r.createdAt.startsWith(dateString)).length;
      
      data.push({
        name: label,
        Notes: notesCreated,
        Vault: vaultCreated,
        Reminders: remindersCreated
      });
    }
    return data;
  })();

  const stats = [
    { label: 'Total Notes', value: notes.length.toString(), icon: FileText },
    { label: 'Vault Items', value: vault.length.toString(), icon: Lock },
    { label: 'Active Reminders', value: activeReminders.length.toString(), icon: Bell },
    { label: 'AI Actions', value: aiGeneratedCount.toString(), icon: Sparkles },
  ];

  const recentActivity = [
    ...notes.slice(0, 2).map(n => ({
      type: 'note' as const,
      title: n.title,
      time: formatTime(n.createdAt),
      ai: !!n.aiSummary,
    })),
    ...vault.slice(0, 1).map(v => ({
      type: 'vault' as const,
      title: `Added ${v.title}`,
      time: formatTime(v.createdAt),
      ai: false,
    })),
    ...reminders.filter(r => r.aiGenerated).slice(0, 1).map(r => ({
      type: 'agent' as const,
      title: `Created reminder: ${r.title}`,
      time: formatTime(r.createdAt),
      ai: true,
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 4);

  const upcomingReminders = activeReminders.slice(0, 3);

  function formatTime(dateString: string) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back!
          </h1>
          {loading && <RefreshCw className="w-5 h-5 text-primary animate-spin" />}
        </div>
        <p className="text-muted-foreground">Here's what's happening with your vault</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex flex-col p-6 rounded border border-border bg-card hover:border-muted-foreground/30 transition-all duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3 text-muted-foreground">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold mb-1 text-foreground">{stat.value}</p>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* 7-Day Activity Heatmap/Graph */}
      <div className="flex flex-col p-6 rounded border border-border bg-card animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-secondary flex items-center justify-center">
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-none text-foreground">Vault Activity</h3>
              <p className="text-xs text-muted-foreground mt-1.5">7-day view of notes, reminders, and credentials</p>
            </div>
          </div>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activityData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVault" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReminders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--muted-foreground)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10} 
              />
              <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dx={-10}
                allowDecimals={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                formatter={(value) => <span className="text-xs font-semibold text-muted-foreground mr-4">{value}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="Notes" 
                stroke="var(--foreground)" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorNotes)" 
              />
              <Area 
                type="monotone" 
                dataKey="Vault" 
                stroke="var(--muted-foreground)" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorVault)" 
              />
              <Area 
                type="monotone" 
                dataKey="Reminders" 
                stroke="var(--primary)" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorReminders)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="p-6 rounded border border-border bg-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-secondary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">Create a note or vault item to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    {activity.type === 'note' && <FileText className="w-4 h-4" />}
                    {activity.type === 'vault' && <Lock className="w-4 h-4" />}
                    {activity.type === 'agent' && <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate text-foreground">{activity.title}</p>
                      {activity.ai && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase tracking-wider">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="p-6 rounded border border-border bg-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-secondary flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Upcoming Reminders</h3>
            </div>
          </div>

          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming reminders</p>
              <p className="text-xs text-muted-foreground mt-1">Create a reminder or let AI extract them from notes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((reminder, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-1 text-foreground">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {reminder.remindAt.includes('T')
                        ? new Date(reminder.remindAt).toLocaleString()
                        : reminder.remindAt}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Agent Insight */}
      {aiGeneratedCount > 0 && (
        <div className="p-6 rounded border border-border bg-card relative z-10 animate-in fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="font-semibold text-foreground">AI Agent Active</h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                I've analyzed {notes.length} notes and extracted {reminders.filter(r => r.aiGenerated).length} reminders automatically.
                {notes.filter(n => n.aiSummary).length > 0 && ` Generated ${notes.filter(n => n.aiSummary).length} AI summaries.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && vault.length === 0 && reminders.length === 0 && (
        <div className="p-12 rounded border border-border bg-card text-center relative z-10 animate-in fade-in duration-300">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="font-semibold text-base mb-1.5 text-foreground">Welcome to Sanctum!</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start by creating your first note. The AI agent will automatically extract reminders, generate summaries, and suggest tags.
          </p>
        </div>
      )}
    </div>
  );
}
