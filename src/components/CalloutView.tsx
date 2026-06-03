import { useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const CALLOUT_EMOJIS = [
  '\u{1F4A1}', '\u{26A0}\u{FE0F}', '\u{2139}\u{FE0F}', '\u{2705}',
  '\u{274C}', '\u{1F4CC}', '\u{1F525}', '\u{2728}', '\u{1F914}',
  '\u{1F4DD}', '\u{1F3AF}', '\u{1F680}',
];

export function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const emoji: string = node.attrs.emoji;
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <NodeViewWrapper className="callout-block" data-type="callout">
      <div className="callout-emoji-wrap" contentEditable={false}>
        <button
          className="callout-emoji"
          onMouseDown={(e) => {
            e.preventDefault();
            setPickerOpen((v) => !v);
          }}
          aria-label="Change icon"
        >
          {emoji}
        </button>
        {pickerOpen && (
          <div className="callout-emoji-picker">
            {CALLOUT_EMOJIS.map((e) => (
              <button
                key={e}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  updateAttributes({ emoji: e });
                  setPickerOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  );
}
