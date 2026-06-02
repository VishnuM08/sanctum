import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note } from '../types';
import { generateAISummary, extractReminders, suggestTags } from '../utils/mockAI';
import { Plus, Search, Sparkles, Tag, X, Trash2, RefreshCw, Mic, MicOff, PanelLeftClose, PanelLeftOpen, FileText, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../utils/api';
import { clsx } from 'clsx';

export function Notes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [reminders, setReminders] = useLocalStorage<any[]>('reminders', []);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor inputs
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Voice dictation
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Suggestions state
  const [suggestion, setSuggestion] = useState<{ title: string; remindAt: string; context: string } | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Slash Commands states
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearchText, setSlashSearchText] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [slashCursorPos, setSlashCursorPos] = useState(0);

  const slashCommands = [
    { id: 'todo', label: 'Todo List', desc: 'Insert a secure checkbox', syntax: '- [ ] ' },
    { id: 'bullet', label: 'Bulleted List', desc: 'Insert a bullet point', syntax: '• ' },
    { id: 'date', label: 'Current Date', desc: 'Insert date and time stamp', syntax: () => new Date().toLocaleString() },
    { id: 'ai', label: 'AI Assist', desc: 'AI agent auto-completion helper', syntax: 'ai-prompt' }
  ];

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashSearchText.toLowerCase())
  );

  const fetchCloudData = async () => {
    if (!api.isOnline()) return;
    setLoading(true);
    try {
      const cloudNotes = await api.getNotes();
      const cloudReminders = await api.getReminders();
      setNotes(cloudNotes);
      setReminders(cloudReminders);
    } catch (err) {
      toast.error('Failed to sync notes with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  const activeNote = notes.find(n => n.id === selectedNoteId) || notes[0] || null;

  // Auto-select first note if none is selected
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  // Sync editor inputs when selection changes
  useEffect(() => {
    if (activeNote) {
      setEditorTitle(activeNote.title);
      setEditorContent(activeNote.content);
      setSuggestion(null);
    } else {
      setEditorTitle('');
      setEditorContent('');
      setSuggestion(null);
    }
  }, [selectedNoteId, activeNote?.id]);

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!activeNote) return;
    if (editorTitle === activeNote.title && editorContent === activeNote.content) return;

    const saveTimeout = setTimeout(async () => {
      const aiSummary = api.isOnline() ? activeNote.aiSummary : generateAISummary(editorContent);
      const tags = api.isOnline() ? activeNote.tags : suggestTags(editorContent);

      const updatedNotes = notes.map(n =>
        n.id === activeNote.id
          ? { ...n, title: editorTitle, content: editorContent, aiSummary, tags, updatedAt: new Date().toISOString() }
          : n
      );
      setNotes(updatedNotes);

      if (api.isOnline()) {
        try {
          await api.updateNote(activeNote.id, editorTitle, editorContent);
          setTimeout(async () => {
            try {
              const freshNotes = await api.getNotes();
              setNotes(freshNotes);
            } catch {}
          }, 2000);
        } catch {
          toast.error('Failed to sync changes with server');
        }
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [editorTitle, editorContent, activeNote?.id]);

  // Heuristic checklist scanner to automatically check for unchecked todo tasks and suggest reminders
  const scanChecklistReminders = (text: string): { title: string; remindAt: string; context: string } | null => {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('[ ]') || line.includes('- [ ]')) {
        const cleanLine = line.replace(/^[-\s]*\[\s*\]\s*/i, '').trim();
        const lower = cleanLine.toLowerCase();
        
        if (lower.length > 5 && (lower.includes('tomorrow') || lower.includes('weekend') || lower.includes('monday') || lower.includes('friday') || lower.includes('today') || lower.includes('at'))) {
          let title = cleanLine
            .replace(/tomorrow/gi, '')
            .replace(/at \d+([ap]m)?/gi, '')
            .replace(/next \w+/gi, '')
            .trim();
          
          if (title.length < 3) title = cleanLine;

          let remindAt = 'Tomorrow at 10:00 AM';
          if (lower.includes('weekend')) remindAt = 'This Saturday at 10:00 AM';
          else if (lower.includes('next week')) remindAt = 'Next Monday at 9:00 AM';
          else if (lower.includes('monday')) remindAt = 'Next Monday at 10:00 AM';
          else if (lower.includes('friday')) remindAt = 'This Friday at 10:00 AM';

          return {
            title: title.charAt(0).toUpperCase() + title.slice(1),
            remindAt,
            context: `Checkbox task in note: ${editorTitle}`
          };
        }
      }
    }
    return null;
  };

  // Debounced auto-suggestion trigger
  useEffect(() => {
    if (!editorContent.trim() || !activeNote) {
      setSuggestion(null);
      return;
    }

    const suggestionTimeout = setTimeout(() => {
      // 1. Checklist suggestions take priority
      const checkSuggest = scanChecklistReminders(editorContent);
      if (checkSuggest && !dismissedSuggestions.has(checkSuggest.title)) {
        setSuggestion(checkSuggest);
        return;
      }

      // 2. Fall back to generic paragraph parser
      const detected = extractReminders(editorContent, activeNote.id);
      if (detected.length > 0) {
        const newSuggest = detected.find(s => !dismissedSuggestions.has(s.title));
        if (newSuggest) {
          setSuggestion(newSuggest);
        } else {
          setSuggestion(null);
        }
      } else {
        setSuggestion(null);
      }
    }, 800);

    return () => clearTimeout(suggestionTimeout);
  }, [editorContent, dismissedSuggestions, activeNote?.id]);

  // Dictation initializer
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setEditorContent(prev => prev ? prev + ' ' + transcript : transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsDictating(false);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleDictation = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isDictating) {
      recognition.stop();
      setIsDictating(false);
    } else {
      try {
        recognition.start();
        setIsDictating(true);
        toast.success('Listening... Speak to dictate');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateNote = async () => {
    setLoading(true);
    const defaultTitle = 'Untitled';
    const defaultContent = '';

    if (api.isOnline()) {
      try {
        const created = await api.createNote(defaultTitle, defaultContent);
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        toast.success('New note created');
      } catch {
        toast.error('Failed to create note on cloud');
      } finally {
        setLoading(false);
      }
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: defaultTitle,
        content: defaultContent,
        aiGenerated: false,
        tags: ['notes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
      toast.success('New local note created');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (api.isOnline()) {
      setLoading(true);
      try {
        await api.deleteNote(id);
        const filtered = notes.filter(n => n.id !== id);
        setNotes(filtered);
        if (selectedNoteId === id) {
          setSelectedNoteId(filtered[0]?.id || null);
        }
        toast.success('Note deleted');
      } catch {
        toast.error('Failed to delete note');
      } finally {
        setLoading(false);
        setDeleteConfirm(null);
      }
    } else {
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      if (selectedNoteId === id) {
        setSelectedNoteId(filtered[0]?.id || null);
      }
      setDeleteConfirm(null);
      toast.success('Note deleted');
    }
  };

  const handleAddSuggestedReminder = async () => {
    if (!suggestion || !activeNote) return;
    try {
      if (api.isOnline()) {
        await api.createReminder(suggestion.title, suggestion.remindAt, suggestion.context, activeNote.id);
        const updated = await api.getReminders();
        setReminders(updated);
      } else {
        const newReminder = {
          id: Date.now().toString() + Math.random(),
          title: suggestion.title,
          remindAt: suggestion.remindAt,
          context: suggestion.context,
          aiGenerated: true,
          fired: false,
          noteId: activeNote.id,
          createdAt: new Date().toISOString(),
        };
        setReminders(prev => [...prev, newReminder]);
      }
      toast.success(`Created reminder: "${suggestion.title}"`);
      setDismissedSuggestions(prev => new Set(prev).add(suggestion.title));
      setSuggestion(null);
    } catch {
      toast.error('Failed to create reminder');
    }
  };

  const handleDismissSuggestion = () => {
    if (!suggestion) return;
    setDismissedSuggestions(prev => new Set(prev).add(suggestion.title));
    setSuggestion(null);
  };

  // Slash commands typing handler
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setEditorContent(val);

    const lastChar = val[pos - 1];
    if (lastChar === '/') {
      setShowSlashMenu(true);
      setSlashCursorPos(pos - 1);
      setSlashSearchText('');
      setSlashMenuIndex(0);
    } else if (showSlashMenu) {
      const typed = val.slice(slashCursorPos + 1, pos);
      if (typed.includes(' ') || typed.includes('\n')) {
        setShowSlashMenu(false);
      } else {
        setSlashSearchText(typed);
        setSlashMenuIndex(0);
      }
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        applySlashCommand(filteredCommands[slashMenuIndex]);
      } else if (e.key === 'Escape') {
        setShowSlashMenu(false);
      }
    }
  };

  const applySlashCommand = async (command: typeof slashCommands[0]) => {
    const before = editorContent.slice(0, slashCursorPos);
    const after = editorContent.slice(slashCursorPos + 1 + slashSearchText.length);
    
    let insertedText = '';
    if (command.id === 'ai') {
      setShowSlashMenu(false);
      toast.loading('AI Assist is typing...');
      try {
        let reply = '';
        if (api.isOnline()) {
          reply = await api.chatWithAgent(`Complete the following note text: "${editorContent}"`);
        } else {
          reply = `\n[AI Draft]: Based on your notes about "${editorTitle}", we should schedule the follow-up next Monday at 10 AM.`;
        }
        toast.dismiss();
        insertedText = reply;
      } catch {
        toast.dismiss();
        insertedText = '\n[AI Assist failed]';
      }
    } else {
      insertedText = typeof command.syntax === 'function' ? command.syntax() : command.syntax;
    }

    const newContent = before + insertedText + after;
    setEditorContent(newContent);
    setShowSlashMenu(false);

    setTimeout(() => {
      const tx = document.getElementById('noteTextarea') as HTMLTextAreaElement;
      if (tx) {
        tx.focus();
        const newPos = slashCursorPos + insertedText.length;
        tx.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Heading Table of Contents extractor
  const getTableOfContents = () => {
    const lines = editorContent.split('\n');
    const headers: { text: string; level: number; index: number }[] = [];
    
    let charIndex = 0;
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        headers.push({
          text: match[2],
          level: match[1].length,
          index: charIndex
        });
      }
      charIndex += line.length + 1;
    });
    
    return headers;
  };

  const jumpToHeader = (index: number) => {
    const tx = document.getElementById('noteTextarea') as HTMLTextAreaElement;
    if (tx) {
      tx.focus();
      tx.setSelectionRange(index, index);
      const lineCount = editorContent.substring(0, index).split('\n').length;
      const lineHeight = 26;
      tx.scrollTop = lineCount * lineHeight - 50;
      toast.info('Jumped to section');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toc = getTableOfContents();

  return (
    <div className="h-[calc(100vh-130px)] flex border border-border/80 rounded-2xl overflow-hidden bg-card/45 backdrop-blur-xl relative animate-in fade-in duration-500">
      {/* Collapsible Left Sidebar */}
      <div
        className={clsx(
          "border-r border-border/80 flex flex-col transition-all duration-300",
          isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-72 opacity-100'
        )}
      >
        {/* Search & Actions Header */}
        <div className="p-4 border-b border-border/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Pages</span>
            <Button size="xs" onClick={handleCreateNote} disabled={loading}>
              <Plus className="w-3.5 h-3.5" />
              New Page
            </Button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl focus:outline-none text-xs glass-input"
            />
          </div>
        </div>

        {/* Sidebar Notes List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No pages found</div>
          ) : (
            filteredNotes.map((note) => {
              const isActive = activeNote && note.id === activeNote.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={clsx(
                    "group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all",
                    isActive
                      ? 'bg-secondary text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/45'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{note.title || 'Untitled'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity cursor-pointer"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Note Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-4 left-4 p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer z-20"
          title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {activeNote ? (
          <div className="flex-1 overflow-y-auto px-6 py-16 md:px-12 space-y-6">
            {/* Split editor canvas vs Table of Contents */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Note Canvas */}
              <div className="lg:col-span-3 space-y-6 relative">
                {/* Note Title */}
                <input
                  type="text"
                  placeholder="Untitled"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  className="notion-title-input"
                />

                {/* Note Content Textarea */}
                <div className="relative group">
                  <textarea
                    id="noteTextarea"
                    placeholder="Start typing your note here... Type '/' for blocks commands."
                    value={editorContent}
                    onChange={handleContentChange}
                    onKeyDown={handleContentKeyDown}
                    className="notion-textarea"
                  />

                  {/* Speech Dictation Button */}
                  {recognition && (
                    <button
                      type="button"
                      onClick={toggleDictation}
                      className={clsx(
                        "absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer",
                        isDictating
                          ? 'bg-red-500/10 text-red-600 border-red-500/30 animate-pulse'
                          : 'bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/50'
                      )}
                    >
                      {isDictating ? (
                        <>
                          <MicOff className="w-3.5 h-3.5 animate-pulse" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Dictate</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Page Metadata */}
                <div className="pt-6 border-t border-border/50 flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeNote.tags && activeNote.tags.map(tag => (
                      <Badge key={tag} variant="default">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {activeNote.aiSummary && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 max-w-sm">
                      <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate" title={activeNote.aiSummary}>
                        {activeNote.aiSummary}
                      </span>
                    </div>
                  )}
                </div>

                {/* Floating Slash Commands popup menu */}
                {showSlashMenu && filteredCommands.length > 0 && (
                  <div 
                    className="absolute bg-card border border-border shadow-2xl rounded-2xl p-2 w-64 max-h-60 overflow-y-auto animate-in zoom-in duration-150 z-30"
                    style={{ 
                      top: '110px', 
                      left: '0px'
                    }}
                  >
                    <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border/40 mb-1">
                      Blocks Commands
                    </div>
                    {filteredCommands.map((cmd, idx) => (
                      <div
                        key={cmd.id}
                        onClick={() => applySlashCommand(cmd)}
                        className={clsx(
                          "px-3 py-2 rounded-xl text-xs flex flex-col cursor-pointer transition-all",
                          idx === slashMenuIndex 
                            ? "bg-primary text-primary-foreground" 
                            : "text-foreground hover:bg-secondary/60"
                        )}
                      >
                        <span className="font-semibold">{cmd.label}</span>
                        <span className={clsx(
                          "text-[10px]", 
                          idx === slashMenuIndex ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {cmd.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Table of Contents sidebar (desktop only) */}
              <div className="hidden lg:block lg:col-span-1 space-y-4 pt-10 border-l border-border/40 pl-6 sticky top-0 h-fit">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Menu className="w-3.5 h-3.5" />
                  Table of Contents
                </h4>
                {toc.length === 0 ? (
                  <p className="text-[10px] leading-relaxed text-muted-foreground/60">
                    Type markdown headings (e.g. # Planning) to automatically generate page outlines.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {toc.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => jumpToHeader(h.index)}
                        className={clsx(
                          "block text-left text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer truncate w-full",
                          h.level === 1 && "pl-0 font-semibold",
                          h.level === 2 && "pl-3",
                          h.level === 3 && "pl-6 text-[10px]"
                        )}
                      >
                        {h.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No Page Selected</h3>
            <p className="text-sm text-muted-foreground mb-4">Select an existing page from the sidebar or start fresh.</p>
            <Button onClick={handleCreateNote}>
              <Plus className="w-4 h-4" />
              New Page
            </Button>
          </div>
        )}
      </div>

      {/* Floating Auto-Suggestion Alert Pill */}
      {suggestion && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-up duration-300">
          <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-card/90 border border-border shadow-2xl backdrop-blur-md max-w-lg">
            <Sparkles className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold block mb-0.5 text-foreground">AI Suggestion</span>
              <span className="text-muted-foreground">Add reminder "{suggestion.title}" for {suggestion.remindAt}?</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="xs" onClick={handleAddSuggestedReminder}>Add</Button>
              <Button size="xs" variant="outline" onClick={handleDismissSuggestion}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Page"
        description="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
