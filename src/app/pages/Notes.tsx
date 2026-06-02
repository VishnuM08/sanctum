import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note } from '../types';
import { generateAISummary, extractReminders, suggestTags } from '../utils/mockAI';
import { 
  Plus, Search, Sparkles, Tag, X, Trash2, RefreshCw, Mic, 
  MicOff, PanelLeftClose, PanelLeftOpen, FileText, Menu,
  ChevronRight, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../utils/api';
import { clsx } from 'clsx';

interface NoteMetadata {
  icon?: string | null;
  cover?: string | null;
  parentId?: string | null;
}

const parseNoteContent = (content: string): { metadata: NoteMetadata; cleanContent: string } => {
  if (!content) return { metadata: {}, cleanContent: '' };
  const match = content.match(/^<!--\s*metadata:(\{.*?\})\s*-->/);
  if (match) {
    try {
      const metadata = JSON.parse(match[1]);
      const cleanContent = content.slice(match[0].length);
      return { metadata, cleanContent };
    } catch (e) {
      // Fallback
    }
  }
  return { metadata: {}, cleanContent: content };
};

const serializeNoteContent = (cleanContent: string, metadata: NoteMetadata): string => {
  const metadataString = `<!-- metadata:${JSON.stringify(metadata)} -->`;
  return metadataString + cleanContent;
};

export function Notes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [reminders, setReminders] = useLocalStorage<any[]>('reminders', []);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor inputs
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Popover States
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useLocalStorage<Record<string, boolean>>('notes-collapsed-nodes', {});

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
    { id: 'h1', label: 'Heading 1', desc: 'Insert a large heading', syntax: '# ' },
    { id: 'h2', label: 'Heading 2', desc: 'Insert a medium heading', syntax: '## ' },
    { id: 'h3', label: 'Heading 3', desc: 'Insert a small heading', syntax: '### ' },
    { id: 'quote', label: 'Blockquote', desc: 'Insert a styled quote', syntax: '> ' },
    { id: 'callout', label: 'Callout Box', desc: 'Insert a stylized information box', syntax: '> [!NOTE]\n> ' },
    { id: 'divider', label: 'Divider Line', desc: 'Insert a thin horizontal divider', syntax: '\n---\n' },
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
      const { cleanContent } = parseNoteContent(activeNote.content);
      setEditorContent(cleanContent);
      setSuggestion(null);
      setShowIconPicker(false);
      setShowCoverPicker(false);
    } else {
      setEditorTitle('');
      setEditorContent('');
      setSuggestion(null);
    }
  }, [selectedNoteId, activeNote?.id]);

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!activeNote) return;
    const { metadata: currentMetadata, cleanContent: currentClean } = parseNoteContent(activeNote.content);
    if (editorTitle === activeNote.title && editorContent === currentClean) return;

    const saveTimeout = setTimeout(async () => {
      const serializedContent = serializeNoteContent(editorContent, currentMetadata);
      const aiSummary = api.isOnline() ? activeNote.aiSummary : generateAISummary(editorContent);
      const tags = api.isOnline() ? activeNote.tags : suggestTags(editorContent);

      const updatedNotes = notes.map(n =>
        n.id === activeNote.id
          ? { ...n, title: editorTitle, content: serializedContent, aiSummary, tags, updatedAt: new Date().toISOString() }
          : n
      );
      setNotes(updatedNotes);

      if (api.isOnline()) {
        try {
          await api.updateNote(activeNote.id, editorTitle, serializedContent);
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

  // Update note metadata helper
  const updateNoteMetadata = async (noteId: string, updates: Partial<NoteMetadata>) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const { metadata, cleanContent } = parseNoteContent(note.content);
    const newMetadata = { ...metadata, ...updates };
    const serializedContent = serializeNoteContent(cleanContent, newMetadata);

    const updatedNotes = notes.map(n =>
      n.id === noteId
        ? { ...n, content: serializedContent, updatedAt: new Date().toISOString() }
        : n
    );
    setNotes(updatedNotes);

    if (api.isOnline()) {
      try {
        await api.updateNote(noteId, note.title, serializedContent);
      } catch {
        toast.error('Failed to sync metadata');
      }
    }
  };

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
      const checkSuggest = scanChecklistReminders(editorContent);
      if (checkSuggest && !dismissedSuggestions.has(checkSuggest.title)) {
        setSuggestion(checkSuggest);
        return;
      }

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
    const defaultTitle = 'Untitled Page';
    const defaultContent = '';

    if (api.isOnline()) {
      try {
        const created = await api.createNote(defaultTitle, defaultContent);
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        toast.success('New page created');
      } catch {
        toast.error('Failed to create page on cloud');
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
      toast.success('New local page created');
      setLoading(false);
    }
  };

  const handleCreateSubNote = async (parentId: string) => {
    setLoading(true);
    const defaultTitle = 'Untitled Sub-page';
    const metadata: NoteMetadata = { parentId };
    const serializedContent = serializeNoteContent('', metadata);

    if (api.isOnline()) {
      try {
        const created = await api.createNote(defaultTitle, serializedContent);
        setNotes([created, ...notes]);
        setSelectedNoteId(created.id);
        setCollapsedNodes(prev => ({ ...prev, [parentId]: false }));
        toast.success('New sub-page created');
      } catch {
        toast.error('Failed to create sub-page on cloud');
      } finally {
        setLoading(false);
      }
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: defaultTitle,
        content: serializedContent,
        aiGenerated: false,
        tags: ['notes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes([newNote, ...notes]);
      setSelectedNoteId(newNote.id);
      setCollapsedNodes(prev => ({ ...prev, [parentId]: false }));
      toast.success('New local sub-page created');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (api.isOnline()) {
      setLoading(true);
      try {
        await api.deleteNote(id);
        // Clear metadata parentId references pointing to the deleted note to prevent orphaned children
        for (const n of notes) {
          const { metadata, cleanContent } = parseNoteContent(n.content);
          if (metadata.parentId === id) {
            updateNoteMetadata(n.id, { parentId: null });
          }
        }
        const filtered = notes.filter(n => n.id !== id);
        setNotes(filtered);
        if (selectedNoteId === id) {
          setSelectedNoteId(filtered[0]?.id || null);
        }
        toast.success('Page deleted');
      } catch {
        toast.error('Failed to delete page');
      } finally {
        setLoading(false);
        setDeleteConfirm(null);
      }
    } else {
      // Offline fallback deletion
      for (const n of notes) {
        const { metadata } = parseNoteContent(n.content);
        if (metadata.parentId === id) {
          updateNoteMetadata(n.id, { parentId: null });
        }
      }
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      if (selectedNoteId === id) {
        setSelectedNoteId(filtered[0]?.id || null);
      }
      setDeleteConfirm(null);
      toast.success('Page deleted');
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
      setEditMode('edit');
      setTimeout(() => {
        const textEl = document.getElementById('noteTextarea') as HTMLTextAreaElement;
        if (textEl) {
          textEl.focus();
          textEl.setSelectionRange(index, index);
          const lineCount = editorContent.substring(0, index).split('\n').length;
          const lineHeight = 26;
          textEl.scrollTop = lineCount * lineHeight - 50;
          toast.info('Jumped to section');
        }
      }, 50);
    }
  };

  // Checklist Checkbox Toggling in Preview mode
  const handleToggleCheckboxInMarkdown = (lineIndex: number) => {
    const lines = editorContent.split('\n');
    const line = lines[lineIndex];
    if (line.includes('[ ]')) {
      lines[lineIndex] = line.replace('[ ]', '[x]');
    } else if (line.includes('[x]')) {
      lines[lineIndex] = line.replace('[x]', '[ ]');
    } else if (line.includes('- [ ]')) {
      lines[lineIndex] = line.replace('- [ ]', '- [x]');
    } else if (line.includes('- [x]')) {
      lines[lineIndex] = line.replace('- [x]', '- [ ]');
    }
    const newCleanContent = lines.join('\n');
    setEditorContent(newCleanContent);

    if (activeNote) {
      const { metadata } = parseNoteContent(activeNote.content);
      const serialized = serializeNoteContent(newCleanContent, metadata);
      const updated = notes.map(n =>
        n.id === activeNote.id ? { ...n, content: serialized, updatedAt: new Date().toISOString() } : n
      );
      setNotes(updated);
      if (api.isOnline()) {
        api.updateNote(activeNote.id, activeNote.title, serialized).catch(() => {});
      }
    }
  };

  // HTML renderer for the interactive document view
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return <p className="text-muted-foreground italic text-sm py-4">Page canvas is empty. Switch to Edit tab to write some markdown content.</p>;
    }

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      // 1. Heading 1
      if (line.startsWith('# ')) {
        elements.push(<h1 key={idx} className="text-3xl font-extrabold text-foreground border-b border-border/40 pb-2 mb-4 mt-6">{line.slice(2)}</h1>);
      }
      // 2. Heading 2
      else if (line.startsWith('## ')) {
        elements.push(<h2 key={idx} className="text-2xl font-bold text-foreground pb-1 mb-3 mt-5">{line.slice(3)}</h2>);
      }
      // 3. Heading 3
      else if (line.startsWith('### ')) {
        elements.push(<h3 key={idx} className="text-xl font-semibold text-foreground mb-2 mt-4">{line.slice(4)}</h3>);
      }
      // 4. Horizontal Divider
      else if (line.trim() === '---') {
        elements.push(<hr key={idx} className="border-border/60 my-6" />);
      }
      // 5. Blockquotes & Custom Gradient Callouts
      else if (line.startsWith('> ')) {
        const quoteContent = line.slice(2);
        if (quoteContent.startsWith('[!NOTE]') || quoteContent.startsWith('[!IMPORTANT]') || quoteContent.startsWith('[!WARNING]')) {
          const type = quoteContent.includes('WARNING') ? 'warning' : quoteContent.includes('IMPORTANT') ? 'important' : 'note';
          const cleanText = quoteContent.replace(/\[!(NOTE|IMPORTANT|WARNING)\]/i, '').trim();
          elements.push(
            <div key={idx} className={clsx(
              "p-4 rounded-xl border my-4 flex gap-3 text-xs leading-relaxed",
              type === 'warning' && "bg-red-500/5 border-red-500/20 text-red-500",
              type === 'important' && "bg-primary/5 border-primary/20 text-primary",
              type === 'note' && "bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/15 text-foreground"
            )}>
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <div>{cleanText}</div>
            </div>
          );
        } else {
          elements.push(
            <blockquote key={idx} className="border-l-4 border-primary pl-4 py-2 my-4 bg-secondary/35 text-sm italic rounded-r-xl text-muted-foreground">
              {quoteContent}
            </blockquote>
          );
        }
      }
      // 6. Interactive Task Checklist
      else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('[ ] ') || line.startsWith('[x] ')) {
        const isChecked = line.includes('[x]');
        const taskText = line.replace(/^(-\s*)?\[[ x]\]\s*/i, '').trim();
        elements.push(
          <div key={idx} className="flex items-center gap-2.5 py-1 text-sm select-none">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggleCheckboxInMarkdown(idx)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
            />
            <span className={clsx(isChecked && "line-through text-muted-foreground")}>{taskText}</span>
          </div>
        );
      }
      // 7. Bullet Lists
      else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.replace(/^([•\-\*])\s*/, '').trim();
        elements.push(
          <ul key={idx} className="list-disc pl-5 my-1 text-sm space-y-1 text-foreground/90">
            <li>{itemText}</li>
          </ul>
        );
      }
      // 8. Numbered Lists
      else if (/^\d+\.\s+/.test(line)) {
        const itemText = line.replace(/^\d+\.\s+/, '').trim();
        elements.push(
          <ol key={idx} className="list-decimal pl-5 my-1 text-sm space-y-1 text-foreground/90">
            <li>{itemText}</li>
          </ol>
        );
      }
      // 9. Standard paragraphs and basic inline text decorators
      else {
        if (line.trim() !== '') {
          let formattedLine: React.ReactNode = line;
          if (line.includes('**')) {
            const parts = line.split('**');
            formattedLine = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-foreground">{part}</strong> : part);
          }
          elements.push(<p key={idx} className="text-sm leading-relaxed text-foreground/90 my-2">{formattedLine}</p>);
        }
      }
    });

    return <div className="space-y-1.5">{elements}</div>;
  };

  // Build recursive note hierarchy tree
  const notesWithMetadata = notes.map(note => {
    const { metadata, cleanContent } = parseNoteContent(note.content);
    return { ...note, metadata, cleanContent };
  });

  const activeNoteParsed = activeNote ? parseNoteContent(activeNote.content) : { metadata: {}, cleanContent: '' };
  const activeNoteMetadata = activeNoteParsed.metadata;

  const toggleNode = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Sidebar Hierarchical Tree Renderer
  const renderSidebarTree = (parentId: string | null, depth = 0) => {
    const levelNotes = notesWithMetadata.filter(n => {
      if (parentId === null) {
        // Root notes are those with parentId unset, or parentId refers to a missing note
        return !n.metadata.parentId || !notes.some(other => other.id === n.metadata.parentId);
      }
      return n.metadata.parentId === parentId;
    });

    if (levelNotes.length === 0) return null;

    return (
      <div className={clsx("space-y-0.5", depth > 0 && "pl-3 border-l border-border/40 ml-2 mt-0.5")}>
        {levelNotes.map(note => {
          const hasChildren = notesWithMetadata.some(n => n.metadata.parentId === note.id);
          const isCollapsed = !!collapsedNodes[note.id];
          const isActive = activeNote && note.id === activeNote.id;
          const icon = note.metadata.icon || '';

          return (
            <div key={note.id} className="space-y-0.5">
              <div
                onClick={() => {
                  setSelectedNoteId(note.id);
                  if (window.innerWidth < 1024) {
                    setIsSidebarCollapsed(true);
                  }
                }}
                className={clsx(
                  "group flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-99",
                  isActive
                    ? 'bg-secondary/90 text-foreground border border-border/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
                )}
              >
                <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(note.id);
                      }}
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                    >
                      <ChevronRight className={clsx("w-3 h-3 transition-transform duration-200", !isCollapsed && "rotate-90")} />
                    </button>
                  ) : (
                    <div className="w-4 flex-shrink-0" />
                  )}

                  <span className="text-sm select-none flex-shrink-0">
                    {icon ? icon : <FileText className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />}
                  </span>

                  <span className="truncate">{note.title || 'Untitled Page'}</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateSubNote(note.id);
                    }}
                    className="p-1 rounded hover:bg-secondary hover:text-foreground text-muted-foreground cursor-pointer"
                    title="Add sub-page"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(note.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {hasChildren && !isCollapsed && renderSidebarTree(note.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // Breadcrumbs generator
  const getBreadcrumbs = (noteId: string) => {
    const list: { id: string; title: string }[] = [];
    let current = notesWithMetadata.find(n => n.id === noteId);
    while (current) {
      list.unshift({ id: current.id, title: current.title });
      const parentId = current.metadata.parentId;
      current = parentId ? notesWithMetadata.find(n => n.id === parentId) : null;
    }
    return list;
  };

  const breadcrumbs = activeNote ? getBreadcrumbs(activeNote.id) : [];

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toc = getTableOfContents();
  const subPages = activeNote ? notesWithMetadata.filter(n => n.metadata.parentId === activeNote.id) : [];

  return (
    <div className="h-[calc(100vh-130px)] lg:h-[calc(100vh-120px)] flex border border-border/80 rounded-2xl overflow-hidden bg-card/45 backdrop-blur-xl relative animate-in fade-in duration-500">
      
      {/* Sidebar Backdrop Overlay on Mobile */}
      {!isSidebarCollapsed && (
        <div 
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-25 lg:hidden animate-in fade-in"
        />
      )}

      {/* Collapsible Left Sidebar (Responsive Overlay Drawer on Mobile, Nested on Desktop) */}
      <div
        className={clsx(
          "transition-all duration-300 flex flex-col z-30 flex-shrink-0",
          "lg:border-r lg:border-border/80 lg:relative lg:opacity-100 lg:pointer-events-auto",
          isSidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'lg:w-72',
          "fixed inset-y-0 left-0 w-80 bg-card border-r border-border/85 shadow-2xl lg:shadow-none lg:bg-transparent",
          isSidebarCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}
      >
        {/* Search & Actions Header */}
        <div className="p-4 border-b border-border/60 flex flex-col gap-3 pt-14 lg:pt-4">
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

        {/* Sidebar Hierarchical Notes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No pages created yet</div>
          ) : (
            renderSidebarTree(null)
          )}
        </div>
      </div>

      {/* Right Note Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-2.5 left-2.5 p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer z-40"
          title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Workspace Header (Breadcrumbs path & Edit/Preview segmented control) */}
            <div className="flex items-center gap-3 h-14 border-b border-border/40 px-6 pl-16 md:pl-16 bg-card/10 backdrop-blur-xs flex-shrink-0">
              <div className="flex-1 min-w-0">
                {breadcrumbs.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-semibold flex-wrap truncate">
                    <span className="truncate">Workspace</span>
                    {breadcrumbs.map((bc, idx) => (
                      <span key={bc.id} className="flex items-center gap-1 min-w-0 truncate">
                        <ChevronRight className="w-3 h-3 text-muted-foreground/35 flex-shrink-0" />
                        <span 
                          onClick={() => setSelectedNoteId(bc.id)}
                          className={clsx(
                            "hover:text-foreground cursor-pointer transition-colors truncate max-w-[80px] sm:max-w-[120px] inline-block font-medium",
                            idx === breadcrumbs.length - 1 && "text-foreground font-bold"
                          )}
                        >
                          {bc.title || 'Untitled'}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Segmented controls tab */}
              <div className="segmented-control flex-shrink-0 scale-90 sm:scale-100">
                <div 
                  className={clsx("segmented-control-item", editMode === 'edit' && "active")}
                  onClick={() => setEditMode('edit')}
                >
                  Edit
                </div>
                <div 
                  className={clsx("segmented-control-item", editMode === 'preview' && "active")}
                  onClick={() => setEditMode('preview')}
                >
                  Preview
                </div>
              </div>
            </div>

            {/* Editor Canvas Container */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Preset Gradient Cover Banner */}
              {activeNoteMetadata.cover && (
                <div 
                  className="h-40 w-full relative group bg-cover bg-center transition-all flex-shrink-0"
                  style={{ backgroundImage: activeNoteMetadata.cover.includes('linear-gradient') ? activeNoteMetadata.cover : `url(${activeNoteMetadata.cover})` }}
                >
                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={() => setShowCoverPicker(!showCoverPicker)}
                      className="px-2.5 py-1.5 rounded-lg bg-card/90 hover:bg-card text-[10px] font-bold shadow border border-border/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      Change Cover
                    </button>
                    <button
                      onClick={() => updateNoteMetadata(activeNote.id, { cover: null })}
                      className="px-2.5 py-1.5 rounded-lg bg-destructive text-white text-[10px] font-bold shadow opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Central text content layout split: Main workspace canvas vs Right Table of Contents */}
              <div className="max-w-5xl mx-auto px-6 py-6 md:px-12 space-y-6">
                
                {/* Custom Page Cover Picker & Page Icon selector controls */}
                <div className="group/header pt-2 space-y-2 relative">
                  
                  {/* Small add buttons if cover or icon are missing */}
                  {(!activeNoteMetadata.cover || !activeNoteMetadata.icon) && (
                    <div className="h-6 flex items-center gap-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      {!activeNoteMetadata.icon && (
                        <button
                          onClick={() => updateNoteMetadata(activeNote.id, { icon: '📝' })}
                          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          😀 Add Icon
                        </button>
                      )}
                      {!activeNoteMetadata.cover && (
                        <button
                          onClick={() => updateNoteMetadata(activeNote.id, { cover: 'linear-gradient(135deg, #0071e3 0%, #3692f5 100%)' })}
                          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          🖼️ Add Cover
                        </button>
                      )}
                    </div>
                  )}

                  {/* Icon view & picker popup */}
                  {activeNoteMetadata.icon && (
                    <div className="relative group/icon w-16 h-16 text-5xl flex items-center justify-start cursor-pointer select-none">
                      <span onClick={() => setShowIconPicker(!showIconPicker)} className="hover:scale-105 transition-transform block">
                        {activeNoteMetadata.icon}
                      </span>
                      <button
                        onClick={() => updateNoteMetadata(activeNote.id, { icon: null })}
                        className="absolute -top-1 left-12 p-1 rounded-full bg-destructive text-white opacity-0 group-hover/icon:opacity-100 transition-all shadow hover:bg-destructive/90 cursor-pointer scale-75"
                        title="Remove Icon"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {showIconPicker && (
                        <div className="absolute top-16 left-0 bg-card border border-border shadow-2xl rounded-2xl p-3 grid grid-cols-4 gap-2 z-40 w-44 animate-in zoom-in duration-150">
                          {['📝', '🚀', '💡', '📅', '🔒', '🔥', '💻', '🎨', '🌟', '🍀', '🍕', '✈️', '💼', '🏡', '🏋️', '📚'].map(emoji => (
                            <span
                              key={emoji}
                              onClick={() => {
                                updateNoteMetadata(activeNote.id, { icon: emoji });
                                setShowIconPicker(false);
                              }}
                              className="text-2xl hover:scale-125 hover:bg-secondary/40 p-1 rounded-lg text-center transition-all"
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cover selector popover panel */}
                  {showCoverPicker && (
                    <div className="absolute top-10 right-0 bg-card border border-border shadow-2xl rounded-2xl p-4 z-40 w-72 space-y-3 animate-in zoom-in duration-150 text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-border/40">
                        <span className="text-xs font-bold text-foreground">Select Preset Cover</span>
                        <button onClick={() => setShowCoverPicker(false)} className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">Close</button>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: 'Ocean Blue', value: 'linear-gradient(135deg, #0071e3 0%, #3692f5 100%)' },
                          { name: 'Sunset Crimson', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
                          { name: 'Cosmic Purple', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                          { name: 'Forest Green', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
                          { name: 'Charcoal Minimal', value: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)' },
                        ].map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              updateNoteMetadata(activeNote.id, { cover: preset.value });
                              setShowCoverPicker(false);
                            }}
                            className="w-full h-8 rounded-lg flex items-center justify-between px-3 text-xs text-white font-semibold cursor-pointer hover:opacity-90 active:scale-98 transition-all"
                            style={{ background: preset.value }}
                          >
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* Main editing workspace or preview container */}
                  <div className="lg:col-span-3 space-y-6 relative">
                    
                    {/* Render Title Input */}
                    <input
                      type="text"
                      placeholder="Untitled Page"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="notion-title-input"
                    />

                    {/* Render workspace body by active tab (Edit vs Preview Document view) */}
                    {editMode === 'edit' ? (
                      <div className="relative group">
                        <textarea
                          id="noteTextarea"
                          placeholder="Start typing your note here... Use standard markdown formatting. Type '/' for blocks commands."
                          value={editorContent}
                          onChange={handleContentChange}
                          onKeyDown={handleContentKeyDown}
                          className="notion-textarea"
                        />

                        {/* Speech Dictation Trigger */}
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
                    ) : (
                      /* Stylized markdown document container in Preview Mode */
                      <div className="prose dark:prose-invert max-w-none pb-12 animate-in fade-in duration-200">
                        {renderMarkdown(editorContent)}

                        {/* Sub-pages child links listings at the bottom of the page */}
                        {subPages.length > 0 && (
                          <div className="pt-8 mt-8 border-t border-border/40 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <ChevronDown className="w-3.5 h-3.5" />
                              Sub-pages Tree Index
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {subPages.map(child => (
                                <div
                                  key={child.id}
                                  onClick={() => setSelectedNoteId(child.id)}
                                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/35 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-primary/20"
                                >
                                  <span className="text-base flex-shrink-0">{child.metadata.icon || '📄'}</span>
                                  <span className="text-xs font-semibold text-foreground truncate">{child.title || 'Untitled sub-page'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Page tag pills & summaries metadata */}
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

                    {/* Floating Slash Commands popup menu overlay */}
                    {showSlashMenu && filteredCommands.length > 0 && (
                      <div 
                        className="absolute bg-card border border-border shadow-2xl rounded-2xl p-2 w-64 max-h-60 overflow-y-auto animate-in zoom-in duration-150 z-30"
                        style={{ 
                          top: '120px', 
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

                  {/* Table of Contents panel (desktop only) */}
                  <div className="hidden lg:block lg:col-span-1 space-y-4 pt-10 border-l border-border/40 pl-6 sticky top-0 h-fit">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Menu className="w-3.5 h-3.5" />
                      Table of Contents
                    </h4>
                    {toc.length === 0 ? (
                      <p className="text-[10px] leading-relaxed text-muted-foreground/60">
                        Type heading lines (e.g. # Planning) to automatically generate outline links.
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
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in duration-300">
            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No Page Selected</h3>
            <p className="text-sm text-muted-foreground mb-4">Select an existing page from the hierarchical tree sidebar or start fresh.</p>
            <Button onClick={handleCreateNote}>
              <Plus className="w-4 h-4" />
              New Page
            </Button>
          </div>
        )}
      </div>

      {/* Floating Auto-Suggestion Alert Pill */}
      {suggestion && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-up duration-300">
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
        description="Are you sure you want to delete this page? This action cannot be undone and will orphan any child sub-pages."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
