import { Card } from '../components/Card';
import { GradientCard } from '../components/GradientCard';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, NotionPage, VaultEntry, Reminder } from '../types';
import { FileText, Lock, Bell, Sparkles, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export function Dashboard() {
  const [oldNotes] = useLocalStorage<Note[]>('notes', []);
  const [notionPages] = useLocalStorage<NotionPage[]>('notion-pages', []);
  const [vault] = useLocalStorage<VaultEntry[]>('vault', []);
  const [reminders] = useLocalStorage<Reminder[]>('reminders', []);

  // Combine old notes and notion pages for stats
  const totalNotes = oldNotes.length + notionPages.length;
  const activeReminders = reminders.filter(r => !r.fired);
  const aiGeneratedCount = oldNotes.filter(n => n.aiGenerated).length +
    notionPages.filter(n => n.aiGenerated).length +
    reminders.filter(r => r.aiGenerated).length;

  const stats = [
    { label: 'Total Pages', value: totalNotes.toString(), icon: FileText, color: 'text-blue-500' },
    { label: 'Vault Items', value: vault.length.toString(), icon: Lock, color: 'text-purple-500' },
    { label: 'Active Reminders', value: activeReminders.length.toString(), icon: Bell, color: 'text-orange-500' },
    { label: 'AI Actions', value: aiGeneratedCount.toString(), icon: Sparkles, color: 'text-green-500' },
  ];

  const recentActivity = [
    ...notionPages.slice(0, 2).map(n => ({
      type: 'note' as const,
      title: n.title,
      time: formatTime(n.updatedAt),
      ai: n.aiGenerated,
    })),
    ...oldNotes.slice(0, 1).map(n => ({
      type: 'note' as const,
      title: n.title,
      time: formatTime(n.createdAt),
      ai: n.aiGenerated,
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
  ].slice(0, 4);

  const upcomingReminders = activeReminders.slice(0, 3);

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Welcome back!
        </h1>
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
                    <p className="text-xs text-muted-foreground">{reminder.remindAt}</p>
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
                I've analyzed {totalNotes} page{totalNotes !== 1 ? 's' : ''} and extracted {reminders.filter(r => r.aiGenerated).length} reminders automatically.
                {(oldNotes.filter(n => n.aiSummary).length + notionPages.filter(n => n.aiSummary).length) > 0 && ` Generated ${oldNotes.filter(n => n.aiSummary).length + notionPages.filter(n => n.aiSummary).length} AI summaries.`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">View Agent Activity</Button>
              </div>
            </div>
          </div>
        </GradientCard>
      )}

      {/* Empty State */}
      {totalNotes === 0 && vault.length === 0 && reminders.length === 0 && (
        <GradientCard gradient="primary" className="border border-primary/20 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h3 className="font-semibold text-lg mb-2">Welcome to Personal Vault!</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Start by creating your first page. The AI agent will automatically extract reminders, generate summaries, and organize your content.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button>Create First Page</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </GradientCard>
      )}
    </div>
  );
}
