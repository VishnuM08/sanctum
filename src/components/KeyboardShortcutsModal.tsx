import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const SHORTCUTS: { group: string; items: { keys: string[]; desc: string }[] }[] = [
  {
    group: 'Navigation',
    items: [
      { keys: ['⌘', 'K'],       desc: 'Quick search / open page' },
      { keys: ['⌘', 'Shift', 'D'], desc: 'Toggle dark mode' },
      { keys: ['⌘', 'Shift', 'F'], desc: 'Zen / distraction-free mode' },
      { keys: ['?'],             desc: 'Show keyboard shortcuts' },
      { keys: ['Esc'],           desc: 'Close modal / exit zen mode' },
    ],
  },
  {
    group: 'Editor',
    items: [
      { keys: ['/'],             desc: 'Slash command menu' },
      { keys: ['@'],             desc: 'Mention a page' },
      { keys: ['⌘', 'B'],       desc: 'Bold' },
      { keys: ['⌘', 'I'],       desc: 'Italic' },
      { keys: ['⌘', 'U'],       desc: 'Underline' },
      { keys: ['⌘', 'Shift', 'S'], desc: 'Strikethrough' },
      { keys: ['⌘', '`'],       desc: 'Inline code' },
      { keys: ['⌘', 'Z'],       desc: 'Undo' },
      { keys: ['⌘', 'Y'],       desc: 'Redo' },
      { keys: ['Tab'],           desc: 'Indent list item' },
      { keys: ['Shift', 'Tab'], desc: 'Outdent list item' },
      { keys: ['Enter'],         desc: 'New block / confirm' },
    ],
  },
  {
    group: 'Block types (after /)',
    items: [
      { keys: ['/text'],     desc: 'Paragraph' },
      { keys: ['/h1'],       desc: 'Heading 1' },
      { keys: ['/h2'],       desc: 'Heading 2' },
      { keys: ['/todo'],     desc: 'To-do list' },
      { keys: ['/code'],     desc: 'Code block' },
      { keys: ['/image'],    desc: 'Image block' },
      { keys: ['/table'],    desc: 'Table block' },
      { keys: ['/toggle'],   desc: 'Toggle / collapsible' },
      { keys: ['/callout'],  desc: 'Callout' },
      { keys: ['/divider'],  desc: 'Divider' },
      { keys: ['/ai'],       desc: 'AI writing assistant' },
    ],
  },
  {
    group: 'Page actions',
    items: [
      { keys: ['⌘', 'D'],       desc: 'Duplicate page (from options)' },
      { keys: ['⌘', 'Shift', 'M'], desc: 'Export as Markdown' },
    ],
  },
];

export function KeyboardShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        className="shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <span>Keyboard shortcuts</span>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div className="shortcuts-body">
          {SHORTCUTS.map((group) => (
            <div key={group.group} className="shortcuts-group">
              <div className="shortcuts-group-label">{group.group}</div>
              {group.items.map((item) => (
                <div key={item.desc} className="shortcut-row">
                  <span className="shortcut-desc">{item.desc}</span>
                  <div className="shortcut-keys">
                    {item.keys.map((k, i) => (
                      <kbd key={i} className="shortcut-kbd">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
