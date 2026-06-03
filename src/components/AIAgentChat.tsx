import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, Send, Bot, User as UserIcon, RefreshCw,
  Zap, Bell, FileText, Calendar, Clock, TrendingUp
} from 'lucide-react';
import { useStore } from '../store';
import { useToast } from './Toast';
import { api } from '../utils/api';
import type { AgentLog, InboxItem } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export function AIAgentChat() {
  const pages = useStore((s) => s.pages);
  const databases = useStore((s) => s.databases);
  const inboxItems = useStore((s) => s.inboxItems);
  const isServerOnline = useStore((s) => s.isServerOnline);
  const setIsServerOnline = useStore((s) => s.setIsServerOnline);
  
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [cloudDigest, setCloudDigest] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  
  // Chat state
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

  // Sync / Fetch initial backend data
  const fetchData = async () => {
    // Check server status
    const online = await api.checkServer();
    setIsServerOnline(online);

    if (!online) return;
    setLoading(true);
    try {
      const logs = await api.getAgentLogs();
      setAgentLogs(logs);

      const digest = await api.getDailyDigest();
      setCloudDigest(digest);
    } catch (err) {
      console.error('Failed to sync agent data with server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Handle compile digest request
  const handleGenerateDigest = async () => {
    const online = await api.checkServer();
    setIsServerOnline(online);
    
    if (!online) {
      toast('Morning digest compiled locally');
      return;
    }
    
    setLoading(true);
    try {
      const digest = await api.getDailyDigest();
      setCloudDigest(digest);
      toast('Generated fresh digest from server!');
      
      const logs = await api.getAgentLogs();
      setAgentLogs(logs);
    } catch (err) {
      toast('Failed to compile digest');
    } finally {
      setLoading(false);
    }
  };

  // Send message to AI Chatbot
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
      const online = await api.checkServer();
      setIsServerOnline(online);

      let replyText = '';
      if (online) {
        // Query Llama via server
        replyText = await api.chatWithAgent(userMsgText);
        
        // Refresh logs since query generates audit trail
        api.getAgentLogs().then(setAgentLogs).catch(() => {});
      } else {
        // Offline demo fallback logic
        await new Promise(r => setTimeout(r, 800));
        const lower = userMsgText.toLowerCase();
        const activePages = pages.filter(p => !p.isDeleted);
        if (lower.includes('note') || lower.includes('summary') || lower.includes('pages')) {
          replyText = `[Offline Mode] You currently have ${activePages.length} active pages in your workspace. Recent titles: ${
            activePages.slice(0, 3).map(n => n.title || 'Untitled').join(', ') || 'None'
          }.`;
        } else if (lower.includes('reminder') || lower.includes('inbox') || lower.includes('tasks')) {
          replyText = `[Offline Mode] You have ${inboxItems.length} items in your inbox. Upcoming items: ${
            inboxItems.slice(0, 2).map(r => r.title).join(', ') || 'None'
          }.`;
        } else {
          replyText = "I am currently in local offline fallback mode. Please start the docker backend containers to chat with me using Llama RAG on your server!";
        }
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: replyText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      toast('Failed to get response from agent');
    } finally {
      setChatLoading(false);
    }
  };

  // Helper stats variables
  const activePagesCount = useMemo(() => pages.filter((p) => !p.isDeleted).length, [pages]);
  const summarizedNotesCount = useMemo(() => pages.filter((p) => p.aiSummary).length, [pages]);
  const aiRemindersCount = useMemo(() => inboxItems.filter((i) => i.type === 'reminder').length, [inboxItems]);
  const totalActions = activePagesCount + inboxItems.length;

  const morningDigestDate = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }), []);

  // Offline Digest simulation calculations
  const localDigestHighlights = useMemo(() => [
    `You have ${inboxItems.length} inbox reminders pending`,
    `${aiRemindersCount} total reminders found in workspace`,
    `${summarizedNotesCount} page${summarizedNotesCount !== 1 ? 's' : ''} have AI summaries`,
  ], [inboxItems, aiRemindersCount, summarizedNotesCount]);

  const localDigestActionItems = useMemo(() => {
    return inboxItems.slice(0, 3).map((item) => ({
      title: item.title,
      type: item.type === 'reminder' ? 'Reminder' : 'System',
      priority: item.read ? 'medium' : 'high',
    }));
  }, [inboxItems]);

  const formatLogTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="agent-page">
      {/* Header */}
      <div className="agent-header">
        <div className="agent-header-title">
          <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          <div>
            <h1>AI Agent</h1>
            <span>
              {isServerOnline ? (
                <span style={{ color: '#448361', fontWeight: 600 }}>● Online (Llama 3.2 RAG active)</span>
              ) : (
                <span style={{ color: 'var(--text-faint)' }}>● Offline Demo (Mock calculations active)</span>
              )}
            </span>
          </div>
        </div>
        <button
          className="vault-add-btn"
          onClick={handleGenerateDigest}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          Compile Digest
        </button>
      </div>

      <div className="agent-body">
        {/* Left Column: Stats & Chatbot */}
        <div className="agent-main-col">
          {/* Stats Bar */}
          <div className="agent-stats-grid">
            <div className="agent-stat-card">
              <span className="agent-stat-val">{totalActions}</span>
              <span className="agent-stat-label">Total Actions</span>
            </div>
            <div className="agent-stat-card">
              <span className="agent-stat-val">{inboxItems.length}</span>
              <span className="agent-stat-label">Inbox Items</span>
            </div>
            <div className="agent-stat-card">
              <span className="agent-stat-val">{activePagesCount}</span>
              <span className="agent-stat-label">Workspace Pages</span>
            </div>
            <div className="agent-stat-card">
              <span className="agent-stat-val">{summarizedNotesCount}</span>
              <span className="agent-stat-label">AI Summarized</span>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="agent-chat-card">
            <div className="agent-card-header">
              <Bot size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="agent-card-title">Agent Chat</div>
                <div className="agent-card-desc">Ask questions about your notes and reminders context (RAG)</div>
              </div>
            </div>

            {/* Message Area */}
            <div className="agent-chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`agent-message-row ${msg.sender === 'user' ? 'user' : ''}`}>
                  <div className="agent-msg-avatar">
                    {msg.sender === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                  </div>
                  <div className="agent-msg-bubble">{msg.text}</div>
                </div>
              ))}

              {chatLoading && (
                <div className="agent-message-row">
                  <div className="agent-msg-avatar">
                    <Bot size={14} />
                  </div>
                  <div className="agent-msg-bubble">
                    <div className="agent-chat-loading">
                      <div className="agent-chat-dot" />
                      <div className="agent-chat-dot" />
                      <div className="agent-chat-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="agent-chat-input-area">
              <input
                type="text"
                className="agent-chat-input"
                placeholder={isServerOnline ? "Ask anything about your notes, e.g. 'What projects am I working on?'" : "Ollama offline. Chat in offline mock mode..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="agent-chat-submit"
                disabled={chatLoading || !chatInput.trim()}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Morning Digest & Logs */}
        <div className="agent-side-col">
          {/* Morning Digest Card */}
          <div className="agent-side-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Morning Digest</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{morningDigestDate}</div>
              </div>
            </div>

            {isServerOnline && cloudDigest ? (
              <div className="agent-digest-content">{cloudDigest}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {localDigestHighlights.map((highlight, idx) => (
                    <div key={idx} className="agent-digest-highlight">
                      <div className="agent-digest-bullet" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                {localDigestActionItems.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Top Priority Actions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {localDigestActionItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: item.priority === 'high' ? 'rgba(235,87,87,0.1)' : 'var(--bg-hover-strong)', color: item.priority === 'high' ? '#eb5757' : 'var(--text-muted)' }}>
                            {item.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Logs Card */}
          <div className="agent-side-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Agent Logs & Audit Trail</div>
            </div>

            {agentLogs.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                No background logs recorded yet.
              </div>
            ) : (
              <div className="agent-logs-list">
                {agentLogs.map((log) => (
                  <div key={log.id} className="agent-log-item">
                    <div className="agent-log-icon">
                      <Sparkles size={14} />
                    </div>
                    <div className="agent-log-body">
                      <div className="agent-log-action">{log.action}</div>
                      <div className="agent-log-desc">{log.payload || log.description}</div>
                      {log.noteTitle && (
                        <div style={{ fontStyle: 'italic', fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                          Ref: {log.noteTitle}
                        </div>
                      )}
                      <div className="agent-log-meta">
                        <Clock size={9} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
                        <span>{formatLogTime(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
