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
  command: (props: { editor: Editor; range: Range }) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Text',
    description: 'Just start writing with plain text.',
    icon: 'Aa',
    keywords: ['text', 'paragraph', 'plain'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    icon: 'H₁',
    keywords: ['heading', 'h1', 'title', 'big'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    icon: 'H₂',
    keywords: ['heading', 'h2', 'subtitle'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    icon: 'H₃',
    keywords: ['heading', 'h3'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bulleted list',
    description: 'Create a simple bulleted list.',
    icon: '•',
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    description: 'Create a list with numbering.',
    icon: '1.',
    keywords: ['number', 'ordered', 'ol'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'To-do list',
    description: 'Track tasks with checkboxes.',
    icon: '☑',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    icon: '“',
    keywords: ['quote', 'blockquote'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks.',
    icon: '—',
    keywords: ['divider', 'hr', 'horizontal', 'separator', 'line'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Code block',
    description: 'Capture a code snippet.',
    icon: '<>',
    keywords: ['code', 'codeblock', 'snippet'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Toggle',
    description: 'Collapsible block. Click the arrow to expand.',
    icon: '▸',
    keywords: ['toggle', 'collapse', 'fold', 'details'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertToggleBlock().run(),
  },
  {
    title: 'Callout',
    description: 'Make text stand out with an emoji + tinted background.',
    icon: '\u{1F4A1}',
    keywords: ['callout', 'note', 'info', 'warning', 'highlight'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertCalloutBlock().run(),
  },
  {
    title: 'Image',
    description: 'Upload or embed an image from a URL.',
    icon: '🖼️',
    keywords: ['image', 'img', 'photo', 'picture', 'upload', 'embed'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertImageBlock().run(),
  },
  {
    title: 'Table of Contents',
    description: 'Auto-generated index of page headings.',
    icon: '📑',
    keywords: ['toc', 'contents', 'index', 'headings', 'outline'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertToc().run(),
  },
  {
    title: 'Table',
    description: 'Insert a simple grid table.',
    icon: '⊞',
    keywords: ['table', 'grid', 'row', 'column', 'spreadsheet'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'AI Write',
    description: 'Generate or improve text with AI.',
    icon: '✨',
    keywords: ['ai', 'gpt', 'generate', 'write', 'suggest', 'autocomplete', 'magic'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Dispatch a custom event that the page can listen to
      document.dispatchEvent(new CustomEvent('ai:open', { detail: { editor } }));
    },
  },
  {
    title: 'Reminder',
    description: 'Ask the agent to remind you (coming soon).',
    icon: '⏰',
    keywords: ['remind', 'reminder', 'alert', 'notify', 'agent'],
    command: ({ editor, range }) => {
      // Placeholder until the agent layer exists. For now we insert a
      // visible marker so the user sees where reminders would attach.
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent('⏰ Reminder: ')
        .run();
    },
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
