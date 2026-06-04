import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Copy, CheckCheck } from 'lucide-react';
import { useToast } from './Toast';
import { api } from '../utils/api';

interface Props {
  pageTitle: string;
  pageContent: unknown;
  onInsert: (text: string) => void;
  onClose: () => void;
}

type Mode = 'menu' | 'write' | 'summarize' | 'extract';

function buildPromptContext(title: string, content: unknown): string {
  try {
    const text = JSON.stringify(content)
      .replace(/"type":"[^"]+",/g, '')
      .replace(/"text":"([^"]+)"/g, '$1')
      .replace(/[{}\[\]"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);
    return `Page title: ${title}\nContent: ${text}`;
  } catch {
    return `Page title: ${title}`;
  }
}

export function AIPanel({ pageTitle, pageContent, onInsert, onClose }: Props) {
  const { toast } = useToast();

  const [mode,    setMode]    = useState<Mode>('menu');
  const [prompt,  setPrompt]  = useState('');
  const [result,  setResult]  = useState('');
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (mode === 'write') promptRef.current?.focus(); }, [mode]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const run = async (task: 'write' | 'summarize' | 'extract', customPrompt?: string) => {
    setLoading(true);
    setResult('');

    const context = buildPromptContext(pageTitle, pageContent);

    try {
      let promptText = '';
      let systemPrompt = '';
      if (task === 'summarize') {
        systemPrompt = "Summarize the following page concisely in 3-5 bullet points. Use Markdown formatting.";
        promptText = context;
      } else if (task === 'extract') {
        systemPrompt = "Extract all action items, tasks, and to-dos from this page. Format as a Markdown checkbox list.";
        promptText = context;
      } else {
        systemPrompt = `You are a helpful writing assistant. The user is working on a page titled "${pageTitle}". Write a response in Markdown format based on the page context provided.`;
        promptText = `User request: ${customPrompt}\n\nContext from page:\n${context}`;
      }

      const text = await api.generateText(promptText, systemPrompt);
      setResult(text);
    } catch (err) {
      setResult(`❌ Error: ${err instanceof Error ? err.message : 'Failed to connect to local AI'}\n\nPlease check if the local server and Ollama are running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    onInsert(result);
    toast('Inserted into page');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={onClose} />
      <div className="ai-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>AI Assistant</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
        </div>

        {/* Mode: menu */}
        {mode === 'menu' && !result && (
          <div className="ai-menu">
            <button className="ai-menu-btn" onClick={() => { setMode('write'); }}>
              <span className="ai-menu-icon">✍️</span>
              <div>
                <div className="ai-menu-label">Write from prompt</div>
                <div className="ai-menu-desc">Generate content based on your instructions</div>
              </div>
            </button>

            <button className="ai-menu-btn" onClick={() => { setMode('summarize'); run('summarize'); }}>
              <span className="ai-menu-icon">📋</span>
              <div>
                <div className="ai-menu-label">Summarize this page</div>
                <div className="ai-menu-desc">Get a concise summary of the page content</div>
              </div>
            </button>

            <button className="ai-menu-btn" onClick={() => { setMode('extract'); run('extract'); }}>
              <span className="ai-menu-icon">✅</span>
              <div>
                <div className="ai-menu-label">Extract action items</div>
                <div className="ai-menu-desc">Find tasks and to-dos mentioned on this page</div>
              </div>
            </button>
          </div>
        )}

        {/* Mode: write input */}
        {mode === 'write' && !result && (
          <div className="ai-write-area">
            <textarea
              ref={promptRef}
              className="ai-prompt-input"
              placeholder="What would you like to write? e.g. 'Write a project brief for a mobile app redesign'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                  e.preventDefault();
                  run('write', prompt);
                }
              }}
              rows={3}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="settings-btn secondary" onClick={() => setMode('menu')} style={{ fontSize: 13 }}>Back</button>
              <button
                className="settings-btn primary"
                onClick={() => prompt.trim() && run('write', prompt)}
                disabled={!prompt.trim() || loading}
                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={12} /> Generate
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="ai-loading">
            <div className="ai-spinner" />
            <span>Generating with local AI…</span>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="ai-result-area">
            <div className="ai-result-text">{result}</div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <button className="settings-btn primary" onClick={handleInsert} style={{ fontSize: 13 }}>
                Insert into page
              </button>
              <button className="settings-btn secondary" onClick={handleCopy} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                {copied ? <><CheckCheck size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
              <button className="settings-btn secondary" onClick={() => { setResult(''); setMode('menu'); setPrompt(''); }} style={{ fontSize: 13 }}>
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
