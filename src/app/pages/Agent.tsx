import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { GradientCard } from '../components/GradientCard';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, Reminder, AgentLog } from '../types';
import { Sparkles, TrendingUp, Bell, FileText, Calendar, Zap, Clock, Send, Bot, User as UserIcon, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export function Agent() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('reminders', []);
  const [agentLogs, setAgentLogs] = useLocalStorage<AgentLog[]>('agent-logs', []);
  const [loading, setLoading] = useState(false);
  const [cloudDigest, setCloudDigest] = useState<string | null>(null);

  // Chatbot State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am your Vault AI Agent. I can help you search, summarize, and cross-reference your notes and reminders. Ask me anything!",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchCloudData = async () => {
    if (!api.isOnline()) return;
    setLoading(true);
    try {
      const logs = await api.getAgentLogs();
      setAgentLogs(logs);

      const notesData = await api.getNotes();
      setNotes(notesData);

      const remindersData = await api.getReminders();
      setReminders(remindersData);
    } catch (err) {
      toast.error('Failed to sync agent logs with server');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDigest = async () => {
    if (!api.isOnline()) {
      toast.info('Morning digest generated locally');
      return;
    }
    setLoading(true);
    try {
      const digest = await api.getDailyDigest();
      setCloudDigest(digest);
      toast.success('Generated fresh digest from server!');
      const logs = await api.getAgentLogs();
      setAgentLogs(logs);
    } catch (err) {
      toast.error('Failed to compile digest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
    if (api.isOnline()) {
      api.getDailyDigest()
        .then(setCloudDigest)
        .catch(() => {});
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput.trim();
    setChatInput('');
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      let replyText = '';
      if (api.isOnline()) {
        // Query Ollama with RAG context
        replyText = await api.chatWithAgent(userMsgText);
        // Refresh logs since querying generates logs
        api.getAgentLogs().then(setAgentLogs);
      } else {
        // Local offline regex matching mock
        await new Promise(r => setTimeout(r, 600)); // typing delay
        const lower = userMsgText.toLowerCase();
        if (lower.contains('notes') || lower.contains('summary')) {
          replyText = `You are running in Offline Demo Mode. You currently have ${notes.length} active notes. Latest titles: ${notes.slice(0, 3).map(n => n.title).join(', ')}`;
        } else if (lower.contains('reminder')) {
          replyText = `You have ${reminders.length} reminders in local storage. Upcoming reminders: ${reminders.filter(r => !r.fired).slice(0, 2).map(r => r.title).join(', ') || 'none'}`;
        } else {
          replyText = "I am running in local offline fallback mode. Please start the docker backend to chat with me using Llama RAG on your server!";
        }
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: replyText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      toast.error('Failed to get response from agent');
    } finally {
      setChatLoading(false);
    }
  };

  const aiReminders = reminders.filter(r => r.aiGenerated);
  const aiNotes = notes.filter(n => n.aiGenerated || n.aiSummary);
  const totalActions = aiReminders.length + aiNotes.length;

  const stats = [
    { label: 'Actions Today', value: totalActions.toString(), icon: Zap },
    { label: 'Reminders Created', value: aiReminders.length.toString(), icon: Bell },
    { label: 'Notes Analyzed', value: notes.length.toString(), icon: FileText },
    { label: 'AI Summaries', value: notes.filter(n => n.aiSummary).length.toString(), icon: Calendar },
  ];

  const activeReminders = reminders.filter(r => !r.fired);
  const morningDigestDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const localDigestHighlights = [
    `You have ${activeReminders.length} active reminder${activeReminders.length !== 1 ? 's' : ''}`,
    `${aiReminders.length} AI-extracted reminder${aiReminders.length !== 1 ? 's' : ''} from your notes`,
    `${notes.filter(n => n.aiSummary).length} note${notes.filter(n => n.aiSummary).length !== 1 ? 's' : ''} with AI summaries`,
  ];

  const localDigestActionItems = activeReminders.slice(0, 3).map(r => ({
    title: r.title,
    type: r.aiGenerated ? 'AI reminder' : 'reminder',
    priority: r.aiGenerated ? 'high' : 'medium',
    source: r.aiGenerated ? 'Auto-extracted' : 'Manual',
  }));

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AI Agent
            </h1>
            {loading && <RefreshCw className="w-5 h-5 text-primary animate-spin" />}
          </div>
          <p className="text-muted-foreground">Your intelligent assistant working behind the scenes</p>
        </div>
        <Button onClick={handleGenerateDigest} disabled={loading} size="sm" className="sm:w-auto">
          <Sparkles className="w-4 h-4" />
          Compile Digest
        </Button>
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

      {/* Chat Card */}
      <Card className="flex flex-col h-[500px]">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Agent Chat</h3>
            <p className="text-[11px] text-muted-foreground">Ask questions about your notes and reminders context (RAG)</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                msg.sender === 'user' ? 'bg-primary/10' : 'bg-accent'
              }`}>
                {msg.sender === 'user' ? (
                  <UserIcon className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-foreground" />
                )}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/10 rounded-tr-none' 
                  : 'bg-card border border-border/80 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-start gap-3 max-w-[85%] animate-pulse">
              <div className="p-2 rounded-xl bg-accent flex-shrink-0">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <div className="p-3 bg-card border border-border/80 rounded-2xl rounded-tl-none">
                <div className="flex gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-border mt-auto">
          <input
            type="text"
            placeholder={api.isOnline() ? "Type your query (e.g. 'what projects am I working on?')..." : "Ollama offline. Basic mock commands available..."}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
            className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-sm glass-input"
          />
          <Button type="submit" size="sm" className="h-full aspect-square p-3" disabled={chatLoading || !chatInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>

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
            <p className="text-sm text-muted-foreground">{morningDigestDate}</p>
          </div>
        </div>

        {api.isOnline() && cloudDigest ? (
          <div className="space-y-4 bg-background/30 p-5 rounded-2xl border border-white/10 text-sm leading-relaxed whitespace-pre-line font-medium text-foreground">
            {cloudDigest}
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {localDigestHighlights.map((highlight, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 shadow-lg shadow-primary/50" />
                  <p className="text-sm font-medium">{highlight}</p>
                </div>
              ))}
            </div>

            {localDigestActionItems.length > 0 && (
              <div className="border-t border-primary/20 pt-6">
                <h4 className="font-semibold mb-4">Top Priority Actions</h4>
                <div className="space-y-3">
                  {localDigestActionItems.map((item, i) => (
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
          </>
        )}
      </GradientCard>

      {/* Agent Activity Log */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold">Agent Activity Audit Logs</h3>
        </div>

        {agentLogs.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No agent activity logged yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {api.isOnline() ? 'Create a note or save passwords to trigger the AI agent brain' : 'Create notes locally to see logs'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">{log.action}</Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{log.payload || log.description}</p>
                  {log.noteTitle && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Related to: {log.noteTitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(log.timestamp || log.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
