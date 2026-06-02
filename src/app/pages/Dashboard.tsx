import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { GradientCard } from '../components/GradientCard';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, VaultEntry, Reminder } from '../types';
import { FileText, Lock, Bell, Sparkles, TrendingUp, Clock, ArrowRight, RefreshCw, Activity } from 'lucide-react';
import { api } from '../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-xl border border-border/80 p-3 rounded-xl shadow-xl text-xs font-semibold space-y-1.5">
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
    { label: 'Total Notes', value: notes.length.toString(), icon: FileText, color: 'text-blue-500' },
    { label: 'Vault Items', value: vault.length.toString(), icon: Lock, color: 'text-purple-500' },
    { label: 'Active Reminders', value: activeReminders.length.toString(), icon: Bell, color: 'text-orange-500' },
    { label: 'AI Actions', value: aiGeneratedCount.toString(), icon: Sparkles, color: 'text-green-500' },
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
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
            <Card
              key={stat.label}
              hover
              className="flex flex-col"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.color.replace('text-', 'bg-')}/10`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </Card>
          );
        })}
      </div>

      {/* 7-Day Activity Heatmap/Graph */}
      <Card className="flex flex-col animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-none">Vault Activity</h3>
              <p className="text-xs text-muted-foreground mt-1">7-day view of notes, reminders, and credentials</p>
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
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVault" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReminders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
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
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorNotes)" 
              />
              <Area 
                type="monotone" 
                dataKey="Vault" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVault)" 
              />
              <Area 
                type="monotone" 
                dataKey="Reminders" 
                stroke="#ec4899" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReminders)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Recent Activity</h3>
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
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {activity.type === 'note' && <FileText className="w-4 h-4 text-primary" />}
                    {activity.type === 'vault' && <Lock className="w-4 h-4 text-primary" />}
                    {activity.type === 'agent' && <Sparkles className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      {activity.ai && <Badge variant="primary">AI</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Reminders */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold">Upcoming Reminders</h3>
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
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group">
                  <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-orange-500 shadow-lg shadow-orange-500/50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-1">{reminder.title}</p>
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
        </Card>
      </div>

      {/* AI Agent Insight */}
      {aiGeneratedCount > 0 && (
        <GradientCard gradient="primary" className="border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-primary/30 animate-in bounce-in">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">AI Agent Working</h4>
                <Badge variant="primary">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                I've analyzed {notes.length} notes and extracted {reminders.filter(r => r.aiGenerated).length} reminders automatically.
                {notes.filter(n => n.aiSummary).length > 0 && ` Generated ${notes.filter(n => n.aiSummary).length} AI summaries.`}
              </p>
            </div>
          </div>
        </GradientCard>
      )}

      {/* Empty State */}
      {notes.length === 0 && vault.length === 0 && reminders.length === 0 && (
        <GradientCard gradient="primary" className="border border-primary/20 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="font-semibold text-lg mb-2">Welcome to Personal Vault!</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Start by creating your first note. The AI agent will automatically extract reminders, generate summaries, and suggest tags.
          </p>
        </GradientCard>
      )}
    </div>
  );
}
