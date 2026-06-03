/*
 * Block menu — the popup that opens from the drag handle's ⋮⋮ button.
 * Operates on the top-level node at `nodePos` in the editor doc.
 *
 * Actions:
 *   Delete    — remove the entire block
 *   Duplicate — copy the block's JSON and insert it right after
 *   Turn into — replace the block's type (paragraph/heading/list/etc.)
 */
import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface Props {
  editor: Editor;
  /** Doc position of the block node we're operating on. */
  nodePos: number;
  onClose: () => void;
}

interface TurnIntoOption {
  label: string;
  icon: string;
  /** Returns a chain that converts the current block. */
  apply: (editor: Editor) => void;
}

const TURN_INTO: TurnIntoOption[] = [
  { label: 'Text', icon: 'Aa', apply: (e) => e.chain().focus().setParagraph().run() },
  { label: 'Heading 1', icon: 'H₁', apply: (e) => e.chain().focus().setNode('heading', { level: 1 }).run() },
  { label: 'Heading 2', icon: 'H₂', apply: (e) => e.chain().focus().setNode('heading', { level: 2 }).run() },
  { label: 'Heading 3', icon: 'H₃', apply: (e) => e.chain().focus().setNode('heading', { level: 3 }).run() },
  { label: 'Bulleted list', icon: '•', apply: (e) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered list', icon: '1.', apply: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'To-do', icon: '☑', apply: (e) => e.chain().focus().toggleTaskList().run() },
  { label: 'Quote', icon: '“', apply: (e) => e.chain().focus().setBlockquote().run() },
  { label: 'Code', icon: '<>', apply: (e) => e.chain().focus().toggleCodeBlock().run() },
];

export function BlockMenu({ editor, nodePos, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [turnIntoOpen, setTurnIntoOpen] = useState(false);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const node = editor.state.doc.nodeAt(nodePos);
  if (!node) return null;

  const handleDelete = () => {
    editor
      .chain()
      .focus()
      .deleteRange({ from: nodePos, to: nodePos + node.nodeSize })
      .run();
    onClose();
  };

  const handleDuplicate = () => {
    const json = node.toJSON();
    editor
      .chain()
      .focus()
      .insertContentAt(nodePos + node.nodeSize, json)
      .run();
    onClose();
  };

  const handleTurnInto = (opt: TurnIntoOption) => {
    // Move selection into this block first so the chain commands target it.
    editor.commands.setTextSelection(nodePos + 1);
    opt.apply(editor);
    onClose();
  };

  return (
    <div className="block-menu" ref={ref}>
      <button className="block-menu-item" onMouseDown={(e) => { e.preventDefault(); handleDelete(); }}>
        <span className="ico">{'\u{1F5D1}'}</span>
        <span>Delete</span>
      </button>
      <button className="block-menu-item" onMouseDown={(e) => { e.preventDefault(); handleDuplicate(); }}>
        <span className="ico">{'\u{29C9}'}</span>
        <span>Duplicate</span>
      </button>
      <div
        className="block-menu-item"
        onMouseEnter={() => setTurnIntoOpen(true)}
        onMouseLeave={() => setTurnIntoOpen(false)}
        style={{ position: 'relative' }}
      >
        <span className="ico">{'↻'}</span>
        <span style={{ flex: 1 }}>Turn into</span>
        <span style={{ color: 'var(--text-faint)' }}>{'›'}</span>
        {turnIntoOpen && (
          <div className="block-menu block-menu-sub">
            {TURN_INTO.map((opt) => (
              <button
                key={opt.label}
                className="block-menu-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTurnInto(opt);
                }}
              >
                <span className="ico">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
