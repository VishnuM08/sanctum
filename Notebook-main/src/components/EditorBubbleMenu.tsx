/*
 * Inline formatting bubble menu. Appears on non-empty text selection.
 * BubbleMenu from @tiptap/react is a positioned wrapper that listens to the
 * editor's selection state and shows/hides accordingly.
 */
import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { useState } from 'react';

interface Props {
  editor: Editor | null;
}

const TEXT_COLORS = [
  { label: 'Default', value: null },
  { label: 'Gray', value: '#9b9a97' },
  { label: 'Brown', value: '#64473a' },
  { label: 'Orange', value: '#d9730d' },
  { label: 'Yellow', value: '#dfab01' },
  { label: 'Green', value: '#0f7b6c' },
  { label: 'Blue', value: '#0b6e99' },
  { label: 'Purple', value: '#6940a5' },
  { label: 'Pink', value: '#ad1a72' },
  { label: 'Red', value: '#e03e3e' },
];

const HIGHLIGHTS = [
  { label: 'None', value: null },
  { label: 'Gray', value: '#ebeced' },
  { label: 'Brown', value: '#e9e5e3' },
  { label: 'Orange', value: '#faebdd' },
  { label: 'Yellow', value: '#fbf3db' },
  { label: 'Green', value: '#ddedea' },
  { label: 'Blue', value: '#ddebf1' },
  { label: 'Purple', value: '#eae4f2' },
  { label: 'Pink', value: '#f4dfeb' },
  { label: 'Red', value: '#fbe4e4' },
];

export function EditorBubbleMenu({ editor }: Props) {
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);

  if (!editor) return null;

  const promptLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const Btn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      className={`bubble-btn ${active ? 'active' : ''}`}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 80,
        placement: 'top',
      }}
      shouldShow={({ editor, from, to }) => {
        // Hide when collapsed (no selection), in code block, or when an
        // image/atom is selected.
        if (from === to) return false;
        if (editor.isActive('codeBlock')) return false;
        return true;
      }}
    >
      <div className="bubble-menu">
        <Btn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </Btn>
        <Btn title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          {'<>'}
        </Btn>
        <Btn title="Link" active={editor.isActive('link')} onClick={promptLink}>
          {'\u{1F517}'}
        </Btn>

        <div className="bubble-sep" />

        <div className="bubble-dropdown-wrap">
          <Btn title="Text color" onClick={() => { setColorOpen((v) => !v); setHighlightOpen(false); }}>
            <span style={{ color: editor.getAttributes('textStyle').color ?? 'inherit', fontWeight: 600 }}>A</span>
          </Btn>
          {colorOpen && (
            <div className="bubble-dropdown">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.label}
                  className="bubble-color-row"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (c.value === null) editor.chain().focus().unsetColor().run();
                    else editor.chain().focus().setColor(c.value).run();
                    setColorOpen(false);
                  }}
                >
                  <span className="bubble-color-swatch" style={{ background: c.value ?? 'var(--text-primary)' }} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bubble-dropdown-wrap">
          <Btn title="Highlight" onClick={() => { setHighlightOpen((v) => !v); setColorOpen(false); }}>
            <span style={{ background: editor.getAttributes('highlight').color ?? '#fbf3db', padding: '0 4px', borderRadius: 3 }}>H</span>
          </Btn>
          {highlightOpen && (
            <div className="bubble-dropdown">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c.label}
                  className="bubble-color-row"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (c.value === null) editor.chain().focus().unsetHighlight().run();
                    else editor.chain().focus().setHighlight({ color: c.value }).run();
                    setHighlightOpen(false);
                  }}
                >
                  <span className="bubble-color-swatch" style={{ background: c.value ?? 'transparent', border: '1px solid var(--border)' }} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </BubbleMenu>
  );
}
