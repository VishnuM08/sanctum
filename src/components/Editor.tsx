import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { createLowlight, common } from 'lowlight';
import { SlashCommand } from '../editor/SlashCommand';
import { ToggleBlock } from '../editor/Toggle';
import { CalloutBlock } from '../editor/Callout';
import { ImageBlock } from '../editor/ImageBlock.ts';
import { PageMentionMark, buildPageMentionExtension } from '../editor/PageMention';
import { TocBlock } from '../editor/TocBlock';
import { DragHandle } from './DragHandle';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { useStore } from '../store';
import 'tippy.js/dist/tippy.css';

const lowlight = createLowlight(common);

interface Props {
  pageId: string;
  initialContent: unknown;
  onChange: (json: JSONContent) => void;
  onWordCountChange?: (count: number) => void;
  readOnly?: boolean;
  typewriterMode?: boolean;
}

export function Editor({ initialContent, onChange, onWordCountChange, readOnly = false, typewriterMode = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);

  const pages = useStore((s) => s.pages);
  const getPageList = () =>
    pages
      .filter((p) => !p.isDeleted)
      .map((p) => ({ id: p.id, title: p.title || 'Untitled', icon: p.icon || '📄' }));

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading'
            ? `Heading ${(node.attrs as { level: number }).level}`
            : "Type '/' for commands",
        showOnlyCurrent: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: { class: 'code-block-lowlight' },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ToggleBlock,
      CalloutBlock,
      ImageBlock,
      TocBlock,
      PageMentionMark,
      buildPageMentionExtension(getPageList),
      SlashCommand,
    ],
    content: (initialContent as JSONContent | null) ?? undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
      // Word count
      if (onWordCountChange) {
        const text = editor.state.doc.textContent;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        onWordCountChange(words);
      }
    },
    autofocus: false,
  });

  // Sync readOnly
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!wrapRef.current) return;
    setScrollEl(wrapRef.current.closest('.page-scroll') as HTMLElement | null);
  }, []);

  // Typewriter mode: keep cursor vertically centered
  useEffect(() => {
    if (!typewriterMode || !editor || !scrollEl) return;
    const handler = () => {
      const { state, view } = editor;
      try {
        const { from } = state.selection;
        const coords = view.coordsAtPos(from);
        const target = scrollEl.scrollTop + coords.top - scrollEl.getBoundingClientRect().top;
        const center = scrollEl.getBoundingClientRect().height * 0.4;
        scrollEl.scrollTo({ top: target - center, behavior: 'smooth' });
      } catch { /* ignore */ }
    };
    editor.on('selectionUpdate', handler);
    return () => { editor.off('selectionUpdate', handler); };
  }, [editor, scrollEl, typewriterMode]);

  // Wire up mention chip clicks → navigate
  useEffect(() => {
    if (!wrapRef.current) return;
    const handleClick = (e: MouseEvent) => {
      const chip = (e.target as HTMLElement)?.closest?.('.page-mention-chip') as HTMLElement | null;
      if (!chip) return;
      const pageId = chip.getAttribute('data-page-id');
      if (pageId) useStore.getState().navigateToPage(pageId);
    };
    wrapRef.current.addEventListener('click', handleClick);
    return () => wrapRef.current?.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="editor" ref={wrapRef}>
      {!readOnly && <EditorBubbleMenu editor={editor} />}
      {!readOnly && <DragHandle editor={editor} scrollContainer={scrollEl} />}
      <EditorContent editor={editor} />
    </div>
  );
}
