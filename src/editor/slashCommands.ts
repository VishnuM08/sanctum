import type { Editor, Range } from '@tiptap/core';

/**
 * A single command in the slash menu. The `command` callback runs when the
 * user picks the item — it receives the editor + the range that contains the
 * "/foo" text the user typed, so it can delete that range before inserting
 * the new block.
 */
export interface SlashItem {
  title: string;
  description: string;
  icon: string;
  /** Words the user might type to find this item. */
  keywords: string[];
  category?: 'ai' | 'media' | 'interactive' | 'basic';
  command: (props: { editor: Editor; range: Range }) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  // ── AI & Media ──────────────────────────────────────────────────────────
  {
    title: 'AI Write',
    description: 'Generate or improve text with AI.',
    icon: '✨',
    keywords: ['ai', 'gpt', 'generate', 'write', 'suggest', 'autocomplete', 'magic'],
    category: 'ai',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Dispatch a custom event that the page can listen to
      document.dispatchEvent(new CustomEvent('ai:open', { detail: { editor } }));
    },
  },
  {
    title: 'Image',
    description: 'Upload or embed an image from a URL.',
    icon: '🖼️',
    keywords: ['image', 'img', 'photo', 'picture', 'upload', 'embed'],
    category: 'media',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertImageBlock().run(),
  },
  // ── Interactive Blocks ───────────────────────────────────────────────────
  {
    title: 'Toggle',
    description: 'Collapsible block. Click the arrow to expand.',
    icon: '▸',
    keywords: ['toggle', 'collapse', 'fold', 'details'],
    category: 'interactive',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertToggleBlock().run(),
  },
  {
    title: 'Callout',
    description: 'Make text stand out with an emoji + tinted background.',
    icon: '💡',
    keywords: ['callout', 'note', 'info', 'warning', 'highlight'],
    category: 'interactive',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertCalloutBlock().run(),
  },
  {
    title: 'To-do list',
    description: 'Track tasks with checkboxes.',
    icon: '☑',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    category: 'interactive',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Table',
    description: 'Insert a simple grid table.',
    icon: '⊞',
    keywords: ['table', 'grid', 'row', 'column', 'spreadsheet'],
    category: 'interactive',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'Reminder',
    description: 'Ask the agent to remind you (coming soon).',
    icon: '⏰',
    keywords: ['remind', 'reminder', 'alert', 'notify', 'agent'],
    category: 'interactive',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent('⏰ Reminder: ')
        .run();
    },
  },
  // ── Basic blocks ─────────────────────────────────────────────────────────
  {
    title: 'Text',
    description: 'Just start writing with plain text.',
    icon: 'Aa',
    keywords: ['text', 'paragraph', 'plain'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    icon: 'H₁',
    keywords: ['heading', 'h1', 'title', 'big'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    icon: 'H₂',
    keywords: ['heading', 'h2', 'subtitle'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    icon: 'H₃',
    keywords: ['heading', 'h3'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bulleted list',
    description: 'Create a simple bulleted list.',
    icon: '•',
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    description: 'Create a list with numbering.',
    icon: '1.',
    keywords: ['number', 'ordered', 'ol'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    icon: '“',
    keywords: ['quote', 'blockquote'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks.',
    icon: '—',
    keywords: ['divider', 'hr', 'horizontal', 'separator', 'line'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Code block',
    description: 'Capture a code snippet.',
    icon: '<>',
    keywords: ['code', 'codeblock', 'snippet'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Table of Contents',
    description: 'Auto-generated index of page headings.',
    icon: '📑',
    keywords: ['toc', 'contents', 'index', 'headings', 'outline'],
    category: 'basic',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertToc().run(),
  },
];

/** Case-insensitive filter; matches against title + keywords. */
export function filterSlashItems(query: string): SlashItem[] {
  if (!query) return SLASH_ITEMS;
  const q = query.toLowerCase();
  return SLASH_ITEMS.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    return item.keywords.some((k) => k.includes(q));
  });
}
