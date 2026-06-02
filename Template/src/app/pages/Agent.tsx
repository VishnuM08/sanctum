import { Card } from '../components/Card';
import { GradientCard } from '../components/GradientCard';
import { Badge } from '../components/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, NotionPage, Reminder, AgentLog } from '../types';
import { Sparkles, TrendingUp, Bell, FileText, Calendar, Zap, Clock } from 'lucide-react';

export function Agent() {
  const [oldNotes] = useLocalStorage<Note[]>('notes', []);
  const [notionPages] = useLocalStorage<NotionPage[]>('notion-pages', []);
  const [reminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [agentLogs] = useLocalStorage<AgentLog[]>('agent-logs', []);

  const aiReminders = reminders.filter(r => r.aiGenerated);
  const aiNotesCount = oldNotes.filter(n => n.aiGenerated).length + notionPages.filter(n => n.aiGenerated).length;
  const totalNotes = oldNotes.length + notionPages.length;
  const totalSummaries = oldNotes.filter(n => n.aiSummary).length + notionPages.filter(n => n.aiSummary).length;
  const totalActions = aiReminders.length + aiNotesCount;

  const stats = [
    { label: 'Actions Today', value: totalActions.toString(), icon: Zap },
    { label: 'Reminders Created', value: aiReminders.length.toString(), icon: Bell },
    { label: 'Pages Analyzed', value: totalNotes.toString(), icon: FileText },
    { label: 'AI Summaries', value: totalSummaries.toString(), icon: Calendar },
  ];

  const activeReminders = reminders.filter(r => !r.fired);
  const morningDigest = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    highlights: [
      `You have ${activeReminders.length} active reminder${activeReminders.length !== 1 ? 's' : ''}`,
      `${aiReminders.length} AI-extracted reminder${aiReminders.length !== 1 ? 's' : ''} from your pages`,
      `${totalSummaries} page${totalSummaries !== 1 ? 's' : ''} with AI summaries`,
    ],
    actionItems: activeReminders.slice(0, 3).map(r => ({
      title: r.title,
      type: r.aiGenerated ? 'AI reminder' : 'reminder',
      priority: r.aiGenerated ? 'high' : 'medium',
      source: r.aiGenerated ? 'Auto-extracted' : 'Manual',
    })),
  };

  // Generate activity logs from actual data
  const recentLogs: AgentLog[] = [
    ...notionPages.slice(0, 3).map((page, i) => ({
      id: `page-${i}`,
      action: page.aiSummary ? 'SUMMARY_GENERATED' : 'PAGE_CREATED',
      description: page.aiSummary ? `Generated AI summary for page` : `Page created`,
      timestamp: formatTime(page.updatedAt),
      noteTitle: page.title,
    })),
    ...oldNotes.slice(0, 1).map((note, i) => ({
      id: `note-${i}`,
      action: note.aiSummary ? 'SUMMARY_GENERATED' : 'NOTE_CREATED',
      description: note.aiSummary ? `Generated AI summary for note` : `Note created`,
      timestamp: formatTime(note.createdAt),
      noteTitle: note.title,
    })),
    ...aiReminders.slice(0, 2).map((reminder, i) => ({
      id: `reminder-${i}`,
      action: 'REMINDER_CREATED',
      description: `Created reminder: "${reminder.title}"`,
      timestamp: formatTime(reminder.createdAt),
      noteTitle: reminder.noteId ? (
        notionPages.find(n => n.id === reminder.noteId)?.title ||
        oldNotes.find(n => n.id === reminder.noteId)?.title
      ) : undefined,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

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
          AI Agent
        </h1>
        <p className="text-muted-foreground">Your intelligent assistant working behind the scenes</p>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              hover
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </Card>
          );
        })}
      </div>

      {/* Morning Digest */}
      <GradientCard gradient="primary" className="border border-primary/20">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-primary/30 animate-in bounce-in">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">Morning Digest</h3>
              <Badge variant="primary">Latest</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{morningDigest.date}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {morningDigest.highlights.map((highlight, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50" />
              <p className="text-sm font-medium">{highlight}</p>
            </div>
          ))}
        </div>

        {morningDigest.actionItems.length > 0 && (
          <div className="border-t border-primary/20 pt-6">
            <h4 className="font-semibold mb-4">Top Priority Actions</h4>
            <div className="space-y-3">
              {morningDigest.actionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-colors">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                    item.priority === 'high' ? 'bg-destructive shadow-lg shadow-destructive/50' : 'bg-orange-500 shadow-lg shadow-orange-500/50'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{item.type}</Badge>
                      <span className="text-xs text-muted-foreground">from {item.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GradientCard>

      {/* Agent Activity Log */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">Agent Activity</h3>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No agent activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a note to see the AI agent in action</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentLogs.map((log, index) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">{log.action}</Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{log.description}</p>
                  {log.noteTitle && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Related to: {log.noteTitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* How It Works */}
      <Card>
        <h3 className="font-semibold mb-5">How the AI Agent Works</h3>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 animate-in bounce-in" style={{ animationDelay: '100ms' }}>
              <span className="text-sm font-bold text-white">1</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1.5">Auto-Reminder Extraction</h4>
              <p className="text-sm text-muted-foreground">
                When you write "call mom this weekend" in a note, the agent automatically creates a reminder without you clicking anything.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 animate-in bounce-in" style={{ animationDelay: '200ms' }}>
              <span className="text-sm font-bold text-white">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1.5">Smart Summaries</h4>
              <p className="text-sm text-muted-foreground">
                AI analyzes your notes and generates concise summaries, helping you quickly understand the content at a glance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 animate-in bounce-in" style={{ animationDelay: '300ms' }}>
              <span className="text-sm font-bold text-white">3</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1.5">Context Linking</h4>
              <p className="text-sm text-muted-foreground">
                When a reminder fires, you see the full context from the original note, not just a ping.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 animate-in bounce-in" style={{ animationDelay: '400ms' }}>
              <span className="text-sm font-bold text-white">4</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-1.5">Auto-Tagging</h4>
              <p className="text-sm text-muted-foreground">
                The agent automatically suggests relevant tags based on your note content, making it easy to organize and find information.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
