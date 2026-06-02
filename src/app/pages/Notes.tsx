import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note } from '../types';
import { generateAISummary, extractReminders, suggestTags } from '../utils/mockAI';
import { 
  Plus, Search, Sparkles, Tag, X, Trash2, RefreshCw, Mic, 
  MicOff, PanelLeftClose, PanelLeftOpen, FileText, Menu,
  ChevronRight, ChevronDown, Copy, MoveUp, MoveDown, Download, Layers,
  Lock, Star, Pin, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../utils/api';
import { clsx } from 'clsx';

interface Block {
  id: string;
  type: 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'todo' | 'toggle' | 'quote' | 'divider' | 'callout' | 'code' | 'image';
  content: string;
  properties?: {
    checked?: boolean;
    collapsed?: boolean;
    language?: string;
    calloutType?: 'info' | 'warning' | 'success' | 'error';
    url?: string;
  };
}

interface NoteMetadata {
  icon?: string | null;
  cover?: string | null;
  parentId?: string | null;
  blocks?: Block[];
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

// Conversions helpers
const markdownToBlocks = (markdown: string): Block[] => {
  if (!markdown || !markdown.trim()) {
    return [{ id: `b-init-${Math.random().toString(36).substr(2, 9)}`, type: 'text', content: '' }];
  }
  
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  
  lines.forEach((line, index) => {
    const id = `b-md-${index}-${Math.random().toString(36).substr(2, 9)}`;
    const trimmed = line.trim();
    if (trimmed === '') return; // Skip empty lines in layout

    if (line.startsWith('# ')) {
      blocks.push({ id, type: 'h1', content: line.slice(2) });
    } else if (line.startsWith('## ')) {
      blocks.push({ id, type: 'h2', content: line.slice(3) });
    } else if (line.startsWith('### ')) {
      blocks.push({ id, type: 'h3', content: line.slice(4) });
    } else if (line.startsWith('---')) {
      blocks.push({ id, type: 'divider', content: '' });
    } else if (line.startsWith('> [!NOTE] ') || line.startsWith('> [!IMPORTANT] ') || line.startsWith('> [!WARNING] ')) {
      const type = line.includes('WARNING') ? 'warning' : line.includes('IMPORTANT') ? 'important' : 'note';
      const clean = line.replace(/^>\s*\[!(NOTE|IMPORTANT|WARNING)\]\s*/i, '').trim();
      blocks.push({ 
        id, 
        type: 'callout', 
        content: clean, 
        properties: { calloutType: type } 
      });
    } else if (line.startsWith('> ')) {
      blocks.push({ id, type: 'quote', content: line.slice(2) });
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('[ ] ') || line.startsWith('[x] ')) {
      const checked = line.includes('[x]');
      const content = line.replace(/^(-\s*)?\[[ x]\]\s*/i, '').trim();
      blocks.push({ 
        id, 
        type: 'todo', 
        content, 
        properties: { checked } 
      });
    } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.replace(/^([•\-\*])\s*/, '').trim();
      blocks.push({ id, type: 'bullet', content });
    } else if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, '').trim();
      blocks.push({ id, type: 'number', content });
    } else if (line.startsWith('```')) {
      // Very simple parser check for block code lines
      const cleanCode = line.replace(/^```[a-z]*\n?/gi, '').replace(/```$/gi, '');
      blocks.push({ id, type: 'code', content: cleanCode, properties: { language: 'javascript' } });
    } else {
      blocks.push({ id, type: 'text', content: line });
    }
  });
  
  return blocks.length > 0 ? blocks : [{ id: `b-init-${Math.random().toString(36).substr(2, 9)}`, type: 'text', content: '' }];
};

const blocksToMarkdown = (blocks: Block[]): string => {
  return blocks.map(block => {
    switch (block.type) {
      case 'h1': return `# ${block.content}`;
      case 'h2': return `## ${block.content}`;
      case 'h3': return `### ${block.content}`;
      case 'divider': return '---';
      case 'quote': return `> ${block.content}`;
      case 'bullet': return `- ${block.content}`;
      case 'number': return `1. ${block.content}`;
      case 'todo': return `- [${block.properties?.checked ? 'x' : ' '}] ${block.content}`;
      case 'toggle': return `> ${block.properties?.collapsed ? '▸' : '▾'} ${block.content}`;
      case 'callout':
        const typeTag = block.properties?.calloutType === 'warning' ? '[!WARNING]' : block.properties?.calloutType === 'important' ? '[!IMPORTANT]' : '[!NOTE]';
        return `> ${typeTag} ${block.content}`;
      case 'code':
        return `\`\`\`${block.properties?.language || 'javascript'}\n${block.content}\n\`\`\``;
      case 'image':
        return `![Image](${block.properties?.url || block.content})`;
      case 'text':
      default:
        return block.content;
    }
  }).join('\n');
};

const defaultTemplates = {
  meeting: [
    { id: 'meet-1', type: 'h1', content: 'Product Sync Minutes' },
    { id: 'meet-2', type: 'callout', content: '📅 Date: ' + new Date().toLocaleDateString() + '\n👥 Attendees: Dev Team, Design Lead', properties: { calloutType: 'note' } },
    { id: 'meet-3', type: 'h2', content: 'Agenda Updates' },
    { id: 'meet-4', type: 'bullet', content: 'Finalize custom Google Client ID configuration settings on login panels.' },
    { id: 'meet-5', type: 'bullet', content: 'Revamp mobile navigations with responsive drawer controls.' },
    { id: 'meet-6', type: 'h2', content: 'Action Checklist' },
    { id: 'meet-7', type: 'todo', content: 'Write tests verifying JWT user separation context', properties: { checked: false } },
    { id: 'meet-8', type: 'todo', content: 'Integrate pre-built templates selection widget', properties: { checked: false } }
  ],
  todo: [
    { id: 'list-1', type: 'h1', content: 'Weekly Priorities' },
    { id: 'list-2', type: 'callout', content: 'Protip: Hit "/" inside any block to open the commands popup!', properties: { calloutType: 'info' } },
    { id: 'list-3', type: 'todo', content: 'Implement code block language selection fields', properties: { checked: true } },
    { id: 'list-4', type: 'todo', content: 'Add Drag or reordering buttons for blocks on mobile viewports', properties: { checked: false } },
    { id: 'list-5', type: 'todo', content: 'Optimize asset imports for Capacitor hybrid builds', properties: { checked: false } }
  ],
  journal: [
    { id: 'j-1', type: 'h1', content: 'Daily Log Reflection' },
    { id: 'j-2', type: 'quote', content: '“Simplicity is the ultimate sophistication.” — Leonardo da Vinci' },
    { id: 'j-3', type: 'h2', content: 'What went well today?' },
    { id: 'j-4', type: 'bullet', content: 'Built a modular, highly-interactive React block editor.' },
    { id: 'j-5', type: 'h2', content: 'Gratitude list' },
    { id: 'j-6', type: 'number', content: 'Grateful for clean, beautiful gradients and aesthetic sakura themes.' },
    { id: 'j-7', type: 'number', content: 'Grateful for RAG-based AI tools scheduling items automatically.' }
  ],
  projects: [
    { id: 'pt-h1', type: 'h1', content: 'Team Sprint Dashboard' },
    { id: 'pt-co', type: 'callout', content: 'This sprint tracker helps coordinate development tasks, assign owners, and track launch statuses.', properties: { calloutType: 'note' } },
    { id: 'pt-h2-1', type: 'h2', content: 'Current Sprint Priorities' },
    { id: 'pt-todo-1', type: 'todo', content: 'Implement JWT user authentication', properties: { checked: true } },
    { id: 'pt-todo-2', type: 'todo', content: 'Clean up double sidebar layout', properties: { checked: true } },
    { id: 'pt-todo-3', type: 'todo', content: 'Pre-populate Notion-style template lists', properties: { checked: false } },
    { id: 'pt-todo-4', type: 'todo', content: 'Test production build bundle compilation', properties: { checked: false } },
    { id: 'pt-h2-2', type: 'h2', content: 'Backlog Tasks' },
    { id: 'pt-b-1', type: 'bullet', content: 'Research Ollama LLM intent parsing models' },
    { id: 'pt-b-2', type: 'bullet', content: 'Refine CSS styling transitions for dark mode toggle' }
  ],
  habit: [
    { id: 'ht-h1', type: 'h1', content: 'Daily Habit Streak Tracker' },
    { id: 'ht-co', type: 'callout', content: 'Consistency is key. Track your habits daily to build lasting routines.', properties: { calloutType: 'note' } },
    { id: 'ht-h2-1', type: 'h2', content: 'Morning Routine Streaks' },
    { id: 'ht-todo-1', type: 'todo', content: 'Drink 500ml water', properties: { checked: true } },
    { id: 'ht-todo-2', type: 'todo', content: '15 minutes morning stretching', properties: { checked: true } },
    { id: 'ht-todo-3', type: 'todo', content: 'Read 10 pages of a book', properties: { checked: false } },
    { id: 'ht-h2-2', type: 'h2', content: 'Productivity Habits' },
    { id: 'ht-todo-4', type: 'todo', content: 'Write code for at least 2 hours', properties: { checked: true } },
    { id: 'ht-todo-5', type: 'todo', content: 'Inbox Zero check-in', properties: { checked: false } },
    { id: 'ht-todo-6', type: 'todo', content: '10 minutes evening reflection journal', properties: { checked: false } }
  ],
  weekly: [
    { id: 'wt-h1', type: 'h1', content: 'Week of March 24 - 30' },
    { id: 'wt-co', type: 'callout', content: 'A summary of prioritized tasks and deliverables for the current week.', properties: { calloutType: 'note' } },
    { id: 'wt-h2-1', type: 'h2', content: 'Monday' },
    { id: 'wt-todo-1', type: 'todo', content: 'Sync with design team on sidebar aesthetics', properties: { checked: true } },
    { id: 'wt-todo-2', type: 'todo', content: 'Complete API endpoint integrations for reminders', properties: { checked: true } },
    { id: 'wt-h2-2', type: 'h2', content: 'Tuesday' },
    { id: 'wt-todo-3', type: 'todo', content: 'Fix JWT cookie storage configurations', properties: { checked: true } },
    { id: 'wt-todo-4', type: 'todo', content: 'Draft technical specs for mobile drawer components', properties: { checked: true } },
    { id: 'wt-h2-3', type: 'h2', content: 'Wednesday' },
    { id: 'wt-todo-5', type: 'todo', content: 'Implement split-screen layout for editor', properties: { checked: false } },
    { id: 'wt-todo-6', type: 'todo', content: 'Prepare presentation slides for demo day', properties: { checked: false } }
  ],
  job: [
    { id: 'jt-h1', type: 'h1', content: 'Career Search Pipeline' },
    { id: 'jt-co', type: 'callout', content: 'Keep track of active job openings, resume submissions, and interview loops.', properties: { calloutType: 'note' } },
    { id: 'jt-h2-1', type: 'h2', content: 'Active Pipeline' },
    { id: 'jt-todo-1', type: 'todo', content: 'Google - Software Engineer (Applied, Interviewing)', properties: { checked: true } },
    { id: 'jt-todo-2', type: 'todo', content: 'Stripe - Frontend Engineer (Technical Round)', properties: { checked: false } },
    { id: 'jt-todo-3', type: 'todo', content: 'Vercel - UI Engineer (Offer Stage)', properties: { checked: false } },
    { id: 'jt-h2-2', type: 'h2', content: 'Next Actions' },
    { id: 'jt-b-1', type: 'bullet', content: 'Follow up with Apple recruiter regarding team match call' },
    { id: 'jt-b-2', type: 'bullet', content: 'Refine personal portfolio project page list links' }
  ],
  website: [
    { id: 'pw-h1', type: 'h1', content: 'Personal Portfolio Design' },
    { id: 'pw-co', type: 'callout', content: 'Designing a clean, minimalist personal website to showcase projects.', properties: { calloutType: 'note' } },
    { id: 'pw-h2-1', type: 'h2', content: 'Tech Stack Decisions' },
    { id: 'pw-b-1', type: 'bullet', content: 'Framework: Next.js (App Router)' },
    { id: 'pw-b-2', type: 'bullet', content: 'Styling: Vanilla CSS & CSS Variables' },
    { id: 'pw-b-3', type: 'bullet', content: 'Hosting: Vercel' },
    { id: 'pw-h2-2', type: 'h2', content: 'Layout Structure' },
    { id: 'pw-todo-1', type: 'todo', content: 'Hero page with introductory headline', properties: { checked: true } },
    { id: 'pw-todo-2', type: 'todo', content: 'Projects grid displaying interactive apps', properties: { checked: false } },
    { id: 'pw-todo-3', type: 'todo', content: 'About me page listing developer timeline', properties: { checked: false } }
  ],
  budget: [
    { id: 'mb-h1', type: 'h1', content: 'Personal Finances Dashboard' },
    { id: 'mb-co', type: 'callout', content: 'Track monthly cash flows, expenses, and investment goals.', properties: { calloutType: 'note' } },
    { id: 'mb-h2-1', type: 'h2', content: 'Income Sources' },
    { id: 'mb-b-1', type: 'bullet', content: 'Primary Salary: $5,500' },
    { id: 'mb-b-2', type: 'bullet', content: 'Side projects: $450' },
    { id: 'mb-h2-2', type: 'h2', content: 'Fixed Expenses' },
    { id: 'mb-todo-1', type: 'todo', content: 'Rent / Housing: $1,600', properties: { checked: true } },
    { id: 'mb-todo-2', type: 'todo', content: 'Utilities & Wifi: $120', properties: { checked: true } },
    { id: 'mb-todo-3', type: 'todo', content: 'Subscriptions (Netflix, Spotify, GitHub): $45', properties: { checked: true } }
  ],
  meal: [
    { id: 'mp-h1', type: 'h1', content: 'Weekly Meal Calendar' },
    { id: 'mp-co', type: 'callout', content: 'Plan meals to simplify grocery shopping and save time.', properties: { calloutType: 'note' } },
    { id: 'mp-h2-1', type: 'h2', content: 'Monday Plan' },
    { id: 'mp-b-1', type: 'bullet', content: 'Breakfast: Avocado toast with eggs' },
    { id: 'mp-b-2', type: 'bullet', content: 'Lunch: Quinoa salad with grilled chicken' },
    { id: 'mp-b-3', type: 'bullet', content: 'Dinner: Tomato basil pasta' },
    { id: 'mp-h2-2', type: 'h2', content: 'Tuesday Plan' },
    { id: 'mp-b-4', type: 'bullet', content: 'Breakfast: Greek yogurt with fresh berries' },
    { id: 'mp-b-5', type: 'bullet', content: 'Lunch: Leftover pasta' },
    { id: 'mp-b-6', type: 'bullet', content: 'Dinner: Salmon with roasted asparagus' }
  ],
  travel: [
    { id: 'tp-h1', type: 'h1', content: 'Spring Vacation: Tokyo, Japan' },
    { id: 'tp-co', type: 'callout', content: 'Planning a 7-day trip to Tokyo during the cherry blossom season!', properties: { calloutType: 'note' } },
    { id: 'tp-h2-1', type: 'h2', content: 'Key Reservations' },
    { id: 'tp-todo-1', type: 'todo', content: 'Flight tickets booked (ANA Airlines)', properties: { checked: true } },
    { id: 'tp-todo-2', type: 'todo', content: 'Hotel accommodations in Shinjuku', properties: { checked: true } },
    { id: 'tp-todo-3', type: 'todo', content: 'Ghibli Museum entry passes secured', properties: { checked: true } },
    { id: 'tp-h2-2', type: 'h2', content: 'Packing Checklist' },
    { id: 'tp-todo-4', type: 'todo', content: 'Passport & flight boarding passes', properties: { checked: false } },
    { id: 'tp-todo-5', type: 'todo', content: 'Universal power adapters', properties: { checked: false } },
    { id: 'tp-todo-6', type: 'todo', content: 'Comfortable walking shoes', properties: { checked: false } }
  ]
};

interface NotesProps {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export function Notes({
  notes,
  setNotes,
  selectedNoteId,
  setSelectedNoteId,
  isSidebarCollapsed,
  setIsSidebarCollapsed
}: NotesProps) {
  const [reminders, setReminders] = useLocalStorage<any[]>('reminders', []);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor inputs
  const [editorTitle, setEditorTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([{ id: 'init-1', type: 'text', content: '' }]);
  const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Popover States
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useLocalStorage<Record<string, boolean>>('notes-collapsed-nodes', {});
  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Slash commands block states
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [slashSearchText, setSlashSearchText] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  // Voice dictation
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Suggestions state
  const [suggestion, setSuggestion] = useState<{ title: string; remindAt: string; context: string } | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const slashCommands = [
    { id: 'text', label: 'Text', desc: 'Plain paragraph text', icon: '📝' },
    { id: 'h1', label: 'Heading 1', desc: 'Large title style', icon: 'H1' },
    { id: 'h2', label: 'Heading 2', desc: 'Medium section style', icon: 'H2' },
    { id: 'h3', label: 'Heading 3', desc: 'Small subsection style', icon: 'H3' },
    { id: 'todo', label: 'To-do List', desc: 'Checkboxes with strikethrough', icon: '☑️' },
    { id: 'bullet', label: 'Bullet List', desc: 'Unordered point items', icon: '•' },
    { id: 'number', label: 'Numbered List', desc: 'Ordered layout numbers', icon: '1.' },
    { id: 'toggle', label: 'Toggle List', desc: 'Collapsible text container', icon: '▶️' },
    { id: 'quote', label: 'Blockquote', desc: 'Elegant italic quotes', icon: '“' },
    { id: 'callout', label: 'Callout Box', desc: 'Gradient styled banner', icon: '💡' },
    { id: 'code', label: 'Code Block', desc: 'Syntax highlighted coder', icon: '💻' },
    { id: 'image', label: 'Image URL', desc: 'Embed web images', icon: '🖼️' },
    { id: 'divider', label: 'Divider Line', desc: 'Visual divider rule', icon: '—' },
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
      const { metadata, cleanContent } = parseNoteContent(activeNote.content);
      if (metadata.blocks && metadata.blocks.length > 0) {
        setBlocks(metadata.blocks);
      } else {
        setBlocks(markdownToBlocks(cleanContent));
      }
      setSuggestion(null);
      setShowIconPicker(false);
      setShowCoverPicker(false);
      setActiveSlashBlockId(null);
      setActiveMenuBlockId(null);
    } else {
      setEditorTitle('');
      setBlocks([{ id: 'init-1', type: 'text', content: '' }]);
      setSuggestion(null);
    }
  }, [selectedNoteId, activeNote?.id]);

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!activeNote) return;
    const { metadata: currentMetadata } = parseNoteContent(activeNote.content);
    
    // Check if changed
    const cleanMarkdown = blocksToMarkdown(blocks);
    const serializedBlocks = JSON.stringify(blocks);
    const cachedBlocks = JSON.stringify(currentMetadata.blocks || []);
    
    if (editorTitle === activeNote.title && serializedBlocks === cachedBlocks) return;

    const saveTimeout = setTimeout(async () => {
      const newMetadata = { ...currentMetadata, blocks };
      const serializedContent = serializeNoteContent(cleanMarkdown, newMetadata);
      const aiSummary = api.isOnline() ? activeNote.aiSummary : generateAISummary(cleanMarkdown);
      const tags = api.isOnline() ? activeNote.tags : suggestTags(cleanMarkdown);

      const updatedNotes = notes.map(n =>
        n.id === activeNote.id
          ? { ...n, title: editorTitle, content: serializedContent, aiSummary, tags, updatedAt: new Date().toISOString() }
          : n
      );
      setNotes(updatedNotes);

      if (api.isOnline()) {
        try {
          await api.updateNote(activeNote.id, editorTitle, serializedContent);
        } catch {
          toast.error('Failed to sync changes with server');
        }
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [editorTitle, blocks, activeNote?.id]);

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
  const scanChecklistReminders = (blocksList: Block[]): { title: string; remindAt: string; context: string } | null => {
    for (const block of blocksList) {
      if (block.type === 'todo' && !block.properties?.checked) {
        const cleanLine = block.content.trim();
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
            context: `Checkbox task in page: ${editorTitle}`
          };
        }
      }
    }
    return null;
  };

  // Debounced auto-suggestion trigger
  useEffect(() => {
    if (blocks.length === 0 || !activeNote) {
      setSuggestion(null);
      return;
    }

    const suggestionTimeout = setTimeout(() => {
      const checkSuggest = scanChecklistReminders(blocks);
      if (checkSuggest && !dismissedSuggestions.has(checkSuggest.title)) {
        setSuggestion(checkSuggest);
        return;
      }
    }, 1200);

    return () => clearTimeout(suggestionTimeout);
  }, [blocks, dismissedSuggestions, activeNote?.id]);

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
        // Append text to currently focused block or last block
        setBlocks(prev => {
          const activeId = focusedBlockId || prev[prev.length - 1]?.id;
          return prev.map(b => b.id === activeId ? { ...b, content: b.content ? b.content + ' ' + transcript : transcript } : b);
        });
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
  }, [focusedBlockId]);

  const toggleDictation = () => {
    if (!recognition) {
      toast.error('Speech dictation not supported in this browser');
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
    const defaultBlocks: Block[] = [{ id: 'b-start', type: 'text', content: '' }];
    const serialized = serializeNoteContent('', { blocks: defaultBlocks });

    if (api.isOnline()) {
      try {
        const created = await api.createNote(defaultTitle, serialized);
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
        content: serialized,
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
    const metadata: NoteMetadata = { parentId, blocks: [{ id: 'b-sub', type: 'text', content: '' }] };
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
        // Clear metadata references
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
        toast.success('Page deleted');
      } catch {
        toast.error('Failed to delete page');
      } finally {
        setLoading(false);
        setDeleteConfirm(null);
      }
    } else {
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

  // Block interactions handlers
  const updateBlockContent = (blockId: string, content: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        // Handle slash commands trigger
        const isSlash = content.endsWith('/');
        if (isSlash) {
          setActiveSlashBlockId(blockId);
          setSlashSearchText('');
          setSlashMenuIndex(0);
        } else if (activeSlashBlockId === blockId) {
          // If already open, track filter keys
          const lastIndex = content.lastIndexOf('/');
          if (lastIndex !== -1) {
            const query = content.slice(lastIndex + 1);
            if (query.includes(' ') || query.includes('\n')) {
              setActiveSlashBlockId(null);
            } else {
              setSlashSearchText(query);
            }
          } else {
            setActiveSlashBlockId(null);
          }
        }
        return { ...b, content };
      }
      return b;
    }));
  };

  const toggleTodoCheckbox = (blockId: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId 
        ? { ...b, properties: { ...b.properties, checked: !b.properties?.checked } } 
        : b
    ));
    toast.success('Task toggled');
  };

  const toggleSectionCollapsed = (blockId: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId 
        ? { ...b, properties: { ...b.properties, collapsed: !b.properties?.collapsed } } 
        : b
    ));
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number, block: Block) => {
    const value = block.content;
    
    // Slash commands keyboard navigation
    if (activeSlashBlockId === block.id && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        applyBlockConvert(block.id, filteredCommands[slashMenuIndex].id as any);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveSlashBlockId(null);
        return;
      }
    }

    // Default editor keys
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newId = `b-ent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newBlock: Block = { id: newId, type: 'text', content: '' };
      
      const newBlocksList = [...blocks];
      newBlocksList.splice(index + 1, 0, newBlock);
      setBlocks(newBlocksList);
      setFocusedBlockId(newId);
    } 
    
    else if (e.key === 'Backspace' && value === '') {
      e.preventDefault();
      // If not the first, remove it
      if (blocks.length > 1) {
        const remaining = blocks.filter(b => b.id !== block.id);
        setBlocks(remaining);
        // Focus previous block
        const prevBlock = blocks[index - 1] || blocks[index + 1];
        if (prevBlock) setFocusedBlockId(prevBlock.id);
      } else {
        // If it was list/heading, convert to text
        if (block.type !== 'text') {
          setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'text', properties: {} } : b));
        }
      }
    }
  };

  const applyBlockConvert = (blockId: string, type: Block['type']) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        // Strip off the slash from string
        const cleanContent = b.content.replace(/\/([a-z0-9]*)$/i, '');
        return { 
          ...b, 
          type, 
          content: cleanContent,
          properties: {
            checked: false,
            collapsed: false,
            language: type === 'code' ? 'javascript' : undefined,
            calloutType: type === 'callout' ? 'note' : undefined,
            url: type === 'image' ? 'https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=600' : undefined
          } 
        };
      }
      return b;
    }));
    setActiveSlashBlockId(null);
    setFocusedBlockId(blockId);
    toast.success(`Converted to ${type.toUpperCase()}`);
  };

  // Block reorder & duplicate buttons
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    
    const reordered = [...blocks];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setBlocks(reordered);
    toast.success('Block moved');
  };

  const duplicateBlock = (index: number, block: Block) => {
    const copyId = `b-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const copyBlock: Block = {
      ...block,
      id: copyId,
      properties: block.properties ? { ...block.properties } : undefined
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, copyBlock);
    setBlocks(updated);
    setFocusedBlockId(copyId);
    toast.success('Block duplicated');
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) {
      setBlocks([{ id: 'init-1', type: 'text', content: '' }]);
      return;
    }
    const filtered = blocks.filter(b => b.id !== blockId);
    setBlocks(filtered);
    toast.success('Block deleted');
  };

  // Template select trigger
  const applyTemplate = (templateKey: keyof typeof defaultTemplates) => {
    const templateMeta: Record<string, { icon: string; cover: string; title: string }> = {
      projects: { icon: '🛠️', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200', title: 'Projects & Tasks' },
      habit: { icon: '📅', cover: 'linear-gradient(135deg, #ffd1dc 0%, #ff8da1 100%)', title: 'Habit Tracker' },
      weekly: { icon: '☑️', cover: 'url(https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=800)', title: 'Weekly To-do List' },
      job: { icon: '💼', cover: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)', title: 'Job Application Tracker' },
      website: { icon: '🌐', cover: 'url(https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800)', title: 'Personal Website' },
      budget: { icon: '💰', cover: 'linear-gradient(135deg, #ffe5ec 0%, #ffb3c6 100%)', title: 'Monthly Budget' },
      meal: { icon: '🍳', cover: 'url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800)', title: 'Meal Planner' },
      travel: { icon: '✈️', cover: 'url(https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=800)', title: 'Travel Planner' },
      meeting: { icon: '📅', cover: 'linear-gradient(135deg, #ffd1dc 0%, #ff8da1 100%)', title: 'Meeting Notes' },
      todo: { icon: '☑️', cover: 'url(https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=800)', title: 'Priority Checklist' },
      journal: { icon: '🌸', cover: 'linear-gradient(135deg, #ffe5ec 0%, #ffb3c6 100%)', title: 'Reflection Journal' }
    };

    const tBlocks = defaultTemplates[templateKey].map(b => ({
      ...b,
      id: `b-tmpl-${b.id}-${Math.random().toString(36).substr(2, 5)}`
    }));
    setBlocks(tBlocks);

    const meta = templateMeta[templateKey];
    if (meta && activeNote) {
      setEditorTitle(meta.title);
      updateNoteMetadata(activeNote.id, { icon: meta.icon, cover: meta.cover });
    } else {
      setEditorTitle(defaultTemplates[templateKey][0]?.content || 'My New Page');
    }
    toast.success('Aesthetic template applied!');
  };

  // Export to markdown file trigger
  const handleExportMarkdown = () => {
    const markdown = blocksToMarkdown(blocks);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${editorTitle.replace(/\s+/g, '_') || 'page'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported to Markdown successfully');
  };

  // Focus effect
  useEffect(() => {
    if (focusedBlockId) {
      const tx = document.getElementById(`textarea-${focusedBlockId}`) as HTMLTextAreaElement;
      if (tx) {
        tx.focus();
        // Auto-scroll input into view if needed
        tx.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedBlockId]);

  // Sidebar tree calculations
  const notesWithMetadata = notes.map(note => {
    const { metadata, cleanContent } = parseNoteContent(note.content);
    return { ...note, metadata, cleanContent };
  });

  const activeNoteParsed = activeNote ? parseNoteContent(activeNote.content) : { metadata: {}, cleanContent: '' };
  const activeNoteMetadata = activeNoteParsed.metadata;

  // Breadcrumbs path trail finder
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
  const subPages = activeNote ? notesWithMetadata.filter(n => n.metadata.parentId === activeNote.id) : [];

  // Table of contents outlined lists
  const getTableOfContents = () => {
    const headers: { text: string; level: number; index: number; blockId: string }[] = [];
    blocks.forEach((b, index) => {
      if (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') {
        headers.push({
          text: b.content,
          level: b.type === 'h1' ? 1 : b.type === 'h2' ? 2 : 3,
          index,
          blockId: b.id
        });
      }
    });
    return headers;
  };

  const toc = getTableOfContents();

  // Templates selection card trigger check: title empty, content empty, blocks length <= 1
  const isPageEmpty = editorTitle === '' && blocks.length === 1 && blocks[0].content === '' && blocks[0].type === 'text';

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-[#121212]">
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
            {/* Top Workspace Header */}
            <div className="flex items-center gap-4 h-14 border-b border-border/40 px-6 pl-16 bg-card/10 backdrop-blur-xs flex-shrink-0 justify-between">
              {/* Breadcrumbs, Padlock and Date status */}
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                {breadcrumbs.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground font-semibold flex-wrap truncate">
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

                {/* Padlock and Date badge */}
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground/60 border-l border-border/30 pl-3">
                  <span className="flex items-center gap-1 bg-secondary/35 px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground/80">
                    <Lock className="w-2.5 h-2.5" />
                    Private
                  </span>
                  <span>Edited Jul 19, 2025</span>
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Star rating button */}
                <button
                  onClick={() => toast.success('Added to Favorites!')}
                  className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
                  title="Favorite Page"
                >
                  <Star className="w-4 h-4" />
                </button>

                {/* Pin button */}
                <button
                  onClick={() => toast.success('Pinned note to top!')}
                  className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Pin Page"
                >
                  <Pin className="w-4 h-4" />
                </button>

                {/* Share Button */}
                <button
                  onClick={() => toast.success('Note share link copied to clipboard!')}
                  className="px-2.5 py-1.5 rounded-lg bg-primary hover:opacity-90 text-[10px] font-bold text-primary-foreground shadow-sm flex items-center gap-1 transition-all cursor-pointer hover:scale-[1.01] active:scale-99"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                {/* Export Markdown icon */}
                <button
                  onClick={handleExportMarkdown}
                  className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Export to Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-border/40 mx-1" />

                <div className="segmented-control scale-90 sm:scale-100">
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
            </div>

            {/* Editor Canvas Container */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Preset Cover Banner */}
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

              {/* Workspace Layout grid */}
              <div className="max-w-5xl mx-auto px-6 py-6 md:px-12 space-y-6">
                
                {/* Custom Page Cover picker and icons */}
                <div className="group/header pt-2 space-y-2 relative">
                  {(!activeNoteMetadata.cover || !activeNoteMetadata.icon) && (
                    <div className="h-6 flex items-center gap-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 opacity-0 group-hover/header:opacity-100 transition-opacity pl-2">
                      {!activeNoteMetadata.icon && (
                        <button
                          onClick={() => updateNoteMetadata(activeNote.id, { icon: '🌸' })}
                          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          😀 Add Icon
                        </button>
                      )}
                      {!activeNoteMetadata.cover && (
                        <button
                          onClick={() => updateNoteMetadata(activeNote.id, { cover: 'linear-gradient(135deg, #ffd1dc 0%, #ff8da1 100%)' })}
                          className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          🖼️ Add Cover
                        </button>
                      )}
                    </div>
                  )}

                  {/* Icon view */}
                  {activeNoteMetadata.icon && (
                    <div className={clsx(
                      "relative group/icon transition-all flex items-center select-none rounded-2xl",
                      activeNoteMetadata.cover 
                        ? "-mt-12 bg-[#121212] border border-border/30 shadow-md p-2 w-20 h-20 text-5xl justify-center z-10 ml-2" 
                        : "w-16 h-16 text-5xl justify-start pl-2"
                    )}>
                      <span onClick={() => setShowIconPicker(!showIconPicker)} className="hover:scale-105 transition-transform block cursor-pointer">
                        {activeNoteMetadata.icon}
                      </span>
                      <button
                        onClick={() => updateNoteMetadata(activeNote.id, { icon: null })}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-destructive text-white opacity-0 group-hover/icon:opacity-100 transition-all shadow hover:bg-destructive/90 cursor-pointer scale-75"
                        title="Remove Icon"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {showIconPicker && (
                        <div className="absolute top-20 left-0 bg-card border border-border shadow-2xl rounded-2xl p-3 grid grid-cols-4 gap-2 z-40 w-44 animate-in zoom-in duration-150">
                          {['🌸', '🍒', '📝', '🚀', '💡', '📅', '🔒', '🔥', '💻', '🎨', '🌟', '🍀', '🍕', '✈️', '💼', '📚'].map(emoji => (
                            <span
                              key={emoji}
                              onClick={() => {
                                updateNoteMetadata(activeNote.id, { icon: emoji });
                                setShowIconPicker(false);
                              }}
                              className="text-2xl hover:scale-125 hover:bg-secondary/40 p-1 rounded-lg text-center transition-all cursor-pointer"
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
                        <span className="text-xs font-bold text-foreground">Select Cover Art</span>
                        <button onClick={() => setShowCoverPicker(false)} className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">Close</button>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: 'IBM Mainframe Retro (B&W)', value: 'url(https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200)' },
                          { name: 'Sakura Dream Gradient', value: 'linear-gradient(135deg, #ffd1dc 0%, #ff8da1 100%)' },
                          { name: 'Blossom Garden Soft', value: 'linear-gradient(135deg, #ffe5ec 0%, #ffb3c6 100%)' },
                          { name: 'Cherry Blossom Petals', value: 'url(https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=800)' },
                          { name: 'Pink Sky Spring', value: 'url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800)' },
                          { name: 'Aesthetic Pastel Wall', value: 'url(https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800)' },
                          { name: 'Charcoal Minimal', value: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)' },
                        ].map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              updateNoteMetadata(activeNote.id, { cover: preset.value });
                              setShowCoverPicker(false);
                            }}
                            className="w-full h-9 rounded-lg flex items-center justify-between px-3 text-[10px] text-white font-bold cursor-pointer hover:opacity-90 active:scale-98 transition-all shadow-sm border border-black/5"
                            style={{ 
                              background: preset.value.includes('linear-gradient') ? preset.value : `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), ${preset.value} center/cover` 
                            }}
                          >
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* Main workspace container */}
                  <div className="lg:col-span-3 space-y-6 relative">
                    
                    {/* Render Title */}
                    <input
                      type="text"
                      placeholder="Untitled Page"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="notion-title-input pl-2"
                    />

                    {/* Empty page templates selection cards */}
                    {isPageEmpty && editMode === 'edit' ? (
                      <div className="p-6 rounded-2xl border border-border/80 bg-secondary/15 space-y-4 animate-in zoom-in duration-300 pl-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-primary" />
                          <h4 className="text-sm font-bold text-foreground">Select a pre-built template layout:</h4>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'projects', label: '🛠️ Projects & Tasks', desc: 'Sprint board & priority log' },
                            { key: 'habit', label: '📅 Habit Tracker', desc: 'Streaks & routine logs' },
                            { key: 'weekly', label: '☑️ Weekly To-do List', desc: 'Monday-Friday task schedule' },
                            { key: 'job', label: '💼 Job Tracker', desc: 'Resume submissions & interviews' },
                            { key: 'website', label: '🌐 Personal Website', desc: 'Wireframe designs & stack detail' },
                            { key: 'budget', label: '💰 Monthly Budget', desc: 'Income, expense, and savings' },
                            { key: 'meal', label: '🍳 Meal Planner', desc: 'Weekly recipe agenda' },
                            { key: 'travel', label: '✈️ Travel Planner', desc: 'Tokyo itinerary & packing list' },
                            { key: 'meeting', label: '📅 Meeting Notes', desc: 'Sync agenda tracker' },
                            { key: 'todo', label: '☑️ Priority Checklist', desc: 'Weekly task items' },
                            { key: 'journal', label: '🌸 Reflection Journal', desc: 'Daily log diary' }
                          ].map(t => (
                            <button
                              key={t.key}
                              onClick={() => applyTemplate(t.key as any)}
                              className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/40 text-left cursor-pointer transition-all hover:scale-103 active:scale-98 shadow-sm flex flex-col gap-1"
                            >
                              <span className="text-xs font-bold text-foreground">{t.label}</span>
                              <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setBlocks([{ id: 'b-init-started', type: 'text', content: '' }]);
                            setEditorTitle('New Blank Page');
                          }}
                          className="text-[10px] font-bold text-primary hover:underline block pt-2"
                        >
                          Or start with a blank text canvas
                        </button>
                      </div>
                    ) : editMode === 'edit' ? (
                      /* Block-based editor list container */
                      <div className="space-y-2 pb-12 animate-in fade-in duration-200">
                        {blocks.map((block, idx) => {
                          const isSlashOpen = activeSlashBlockId === block.id;
                          return (
                            <div 
                              key={block.id} 
                              className="group/block relative flex items-start gap-1 pl-2"
                              onMouseLeave={() => setActiveMenuBlockId(null)}
                            >
                              {/* Left hover block reordering handle */}
                              <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                                <button
                                  onClick={() => setActiveMenuBlockId(activeMenuBlockId === block.id ? null : block.id)}
                                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Block actions menu"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Hover action menu panel */}
                              {activeMenuBlockId === block.id && (
                                <div className="absolute left-[-24px] top-7 bg-card border border-border shadow-2xl rounded-xl p-1.5 z-40 w-44 space-y-1 flex flex-col animate-in zoom-in duration-100 text-left">
                                  <button
                                    onClick={() => { moveBlock(idx, 'up'); setActiveMenuBlockId(null); }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-[10px] text-foreground font-semibold cursor-pointer w-full"
                                    disabled={idx === 0}
                                  >
                                    <MoveUp className="w-3 h-3 text-muted-foreground" />
                                    <span>Move Block Up</span>
                                  </button>
                                  <button
                                    onClick={() => { moveBlock(idx, 'down'); setActiveMenuBlockId(null); }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-[10px] text-foreground font-semibold cursor-pointer w-full"
                                    disabled={idx === blocks.length - 1}
                                  >
                                    <MoveDown className="w-3 h-3 text-muted-foreground" />
                                    <span>Move Block Down</span>
                                  </button>
                                  <button
                                    onClick={() => { duplicateBlock(idx, block); setActiveMenuBlockId(null); }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-[10px] text-foreground font-semibold cursor-pointer w-full"
                                  >
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                    <span>Duplicate Block</span>
                                  </button>
                                  <button
                                    onClick={() => { deleteBlock(block.id); setActiveMenuBlockId(null); }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-[10px] text-destructive font-semibold cursor-pointer w-full"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete Block</span>
                                  </button>
                                </div>
                              )}

                              {/* Rendering individual block view components */}
                              <div className="flex-1 min-w-0 flex gap-2 items-start">
                                {/* Checklist indicator check */}
                                {block.type === 'todo' && (
                                  <input
                                    type="checkbox"
                                    checked={!!block.properties?.checked}
                                    onChange={() => toggleTodoCheckbox(block.id)}
                                    className="mt-1.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                  />
                                )}

                                {/* Bullet point symbol */}
                                {block.type === 'bullet' && (
                                  <span className="mt-1.5 text-sm select-none text-muted-foreground/80">•</span>
                                )}

                                {/* Number prefix */}
                                {block.type === 'number' && (
                                  <span className="mt-1.5 text-xs font-bold select-none text-muted-foreground">{idx - blocks.filter((b, i) => i < idx && b.type !== 'number').length + 1}.</span>
                                )}

                                {/* Toggle list arrow */}
                                {block.type === 'toggle' && (
                                  <button
                                    onClick={() => toggleSectionCollapsed(block.id)}
                                    className="mt-1 p-0.5 rounded hover:bg-secondary text-muted-foreground cursor-pointer flex-shrink-0"
                                  >
                                    <ChevronRight className={clsx("w-3.5 h-3.5 transition-transform", !block.properties?.collapsed && "rotate-90")} />
                                  </button>
                                )}

                                {/* Block textarea editable input field */}
                                <textarea
                                  id={`textarea-${block.id}`}
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  onKeyDown={(e) => handleBlockKeyDown(e, idx, block)}
                                  onFocus={() => setFocusedBlockId(block.id)}
                                  placeholder={
                                    block.type === 'h1' ? 'Heading 1' :
                                    block.type === 'h2' ? 'Heading 2' :
                                    block.type === 'h3' ? 'Heading 3' :
                                    block.type === 'todo' ? 'To-do item' :
                                    block.type === 'bullet' ? 'Bullet list item' :
                                    block.type === 'number' ? 'Numbered list item' :
                                    block.type === 'quote' ? 'Write quote here...' :
                                    block.type === 'toggle' ? 'Toggle section title...' :
                                    block.type === 'callout' ? 'Callout text...' :
                                    block.type === 'code' ? 'Write code lines here...' :
                                    block.type === 'image' ? 'Paste image URL here...' :
                                    'Write text block... Type "/" for commands.'
                                  }
                                  rows={1}
                                  className={clsx(
                                    "w-full bg-transparent border-0 resize-none outline-none focus:ring-0 p-0 text-foreground overflow-hidden leading-relaxed",
                                    block.type === 'h1' && "text-2xl font-bold py-1",
                                    block.type === 'h2' && "text-xl font-semibold py-1",
                                    block.type === 'h3' && "text-lg font-semibold py-1",
                                    block.type === 'todo' && clsx("text-sm", block.properties?.checked && "line-through text-muted-foreground"),
                                    block.type === 'quote' && "pl-3 border-l-2 border-primary italic text-muted-foreground text-sm py-1 bg-secondary/10 rounded-r-lg",
                                    block.type === 'code' && "font-mono text-xs bg-secondary/40 p-3 rounded-lg leading-loose border border-border/30",
                                    block.type === 'callout' && "hidden", // callout renders separate below
                                    block.type === 'image' && "hidden", // image renders separate below
                                    block.type === 'divider' && "hidden", // divider renders line only
                                    block.type === 'text' && "text-sm py-0.5"
                                  )}
                                  style={{
                                    height: 'auto',
                                    minHeight: '26px'
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = `${el.scrollHeight}px`;
                                    }
                                  }}
                                />

                                {/* Divider block layout */}
                                {block.type === 'divider' && (
                                  <hr className="w-full border-border/60 my-2.5" />
                                )}

                                {/* Callout Box widget */}
                                {block.type === 'callout' && (
                                  <div className={clsx(
                                    "w-full p-4 rounded-xl border flex gap-3 text-xs leading-relaxed items-center justify-between",
                                    block.properties?.calloutType === 'warning' && "bg-red-500/5 border-red-500/15 text-red-500",
                                    block.properties?.calloutType === 'important' && "bg-primary/5 border-primary/15 text-primary",
                                    block.properties?.calloutType === 'success' && "bg-green-500/5 border-green-500/15 text-green-500",
                                    block.properties?.calloutType === 'note' && "bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/15 text-foreground"
                                  )}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const types: ('note'|'info'|'warning'|'success'|'error')[] = ['note', 'warning', 'success'];
                                        const current = block.properties?.calloutType || 'note';
                                        const next = types[(types.indexOf(current as any) + 1) % types.length];
                                        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, properties: { ...b.properties, calloutType: next as any } } : b));
                                        toast.info(`Switched callout to ${next.toUpperCase()}`);
                                      }}
                                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-base flex-shrink-0"
                                      title="Click to cycle icon"
                                    >
                                      {block.properties?.calloutType === 'warning' ? '⚠️' : block.properties?.calloutType === 'success' ? '✅' : '💡'}
                                    </button>
                                    <textarea
                                      value={block.content}
                                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                      onKeyDown={(e) => handleBlockKeyDown(e, idx, block)}
                                      placeholder="Callout text details..."
                                      className="flex-1 bg-transparent border-0 outline-none resize-none p-0 text-xs overflow-hidden leading-relaxed text-foreground"
                                      style={{ height: 'auto' }}
                                      ref={(el) => {
                                        if (el) {
                                          el.style.height = 'auto';
                                          el.style.height = `${el.scrollHeight}px`;
                                        }
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Code Editor Block widget */}
                                {block.type === 'code' && (
                                  <div className="w-full space-y-1.5">
                                    <div className="flex justify-between items-center bg-secondary/50 p-1 px-3 rounded-t-lg border border-b-0 border-border/40 text-[10px] font-bold text-muted-foreground flex-shrink-0">
                                      <span>CODE BLOCK</span>
                                      <select
                                        value={block.properties?.language || 'javascript'}
                                        onChange={(e) => {
                                          setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, properties: { ...b.properties, language: e.target.value } } : b));
                                          toast.success(`Language set to ${e.target.value}`);
                                        }}
                                        className="bg-transparent border-0 outline-none p-0 font-bold text-[10px] cursor-pointer text-primary"
                                      >
                                        <option value="javascript">JavaScript</option>
                                        <option value="html">HTML</option>
                                        <option value="python">Python</option>
                                        <option value="css">CSS</option>
                                        <option value="java">Java</option>
                                        <option value="cpp">C++</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* Image Block Embeds */}
                                {block.type === 'image' && (
                                  <div className="w-full space-y-3 p-3 border border-border/40 bg-secondary/10 rounded-xl">
                                    <input
                                      type="text"
                                      placeholder="Paste image URL here (e.g. https://images.unsplash.com/...)"
                                      value={block.content}
                                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                      onKeyDown={(e) => handleBlockKeyDown(e, idx, block)}
                                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-background border border-border text-foreground focus:outline-none"
                                    />
                                    {block.content && block.content.startsWith('http') && (
                                      <div className="rounded-xl overflow-hidden shadow max-h-80 border border-border/50 animate-in zoom-in duration-300">
                                        <img
                                          src={block.content}
                                          alt="Embed"
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522383225653-ed1111816951?q=80&w=600';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Slash Command popup dropdown box overlay */}
                              {isSlashOpen && filteredCommands.length > 0 && (
                                <div 
                                  className="absolute bg-card border border-border shadow-2xl rounded-2xl p-2 w-64 max-h-60 overflow-y-auto z-40 animate-in zoom-in duration-150 text-left shadow-primary/5"
                                  style={{ 
                                    top: '32px', 
                                    left: '12px'
                                  }}
                                >
                                  <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border/40 mb-1 flex items-center justify-between">
                                    <span>Blocks Commands</span>
                                    <kbd className="border border-border rounded px-1 text-[8px] bg-secondary/40 font-mono">ESC to exit</kbd>
                                  </div>
                                  {filteredCommands.map((cmd, cIdx) => (
                                    <div
                                      key={cmd.id}
                                      onClick={() => applyBlockConvert(block.id, cmd.id as any)}
                                      className={clsx(
                                        "px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 cursor-pointer transition-all",
                                        cIdx === slashMenuIndex 
                                          ? "bg-primary text-primary-foreground font-semibold" 
                                          : "text-foreground hover:bg-secondary/60"
                                      )}
                                    >
                                      <span className="text-sm select-none">{cmd.icon}</span>
                                      <div className="flex flex-col min-w-0">
                                        <span>{cmd.label}</span>
                                        <span className={clsx(
                                          "text-[9px] truncate", 
                                          cIdx === slashMenuIndex ? "text-primary-foreground/80" : "text-muted-foreground"
                                        )}>
                                          {cmd.desc}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Document layout preview tab view */
                      <div className="prose dark:prose-invert max-w-none pb-12 animate-in fade-in duration-200 pl-2">
                        {renderMarkdown(blocksToMarkdown(blocks))}

                        {/* Rendering Subpages index linkages below */}
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

                    {/* Page metadata tags footer */}
                    <div className="pt-6 border-t border-border/50 flex flex-wrap items-center gap-4 justify-between pl-2">
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
                  </div>

                  {/* Table of Contents panel */}
                  <div className="hidden lg:block lg:col-span-1 space-y-4 pt-10 border-l border-border/40 pl-6 sticky top-0 h-fit">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Menu className="w-3.5 h-3.5" />
                      Table of Contents
                    </h4>
                    {toc.length === 0 ? (
                      <p className="text-[10px] leading-relaxed text-muted-foreground/60">
                        Type Heading Blocks (e.g. H1, H2, H3) to automatically generate outline links.
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
                            {h.text || 'Untitled heading'}
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
