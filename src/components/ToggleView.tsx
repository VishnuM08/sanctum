/*
 * NodeView for the toggle block. NodeViewWrapper is the outer element
 * ProseMirror manages; NodeViewContent is where children are rendered (the
 * editable area). We render the arrow button as a sibling so clicks on it
 * don't move the editor selection.
 */
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const open: boolean = node.attrs.open;

  return (
    <NodeViewWrapper
      className={`toggle-block ${open ? 'open' : 'closed'}`}
      data-type="toggle"
    >
      <button
        className="toggle-arrow"
        contentEditable={false}
        // mousedown so the editor doesn't blur first and lose the selection
        onMouseDown={(e) => {
          e.preventDefault();
          updateAttributes({ open: !open });
        }}
        aria-label={open ? 'Collapse' : 'Expand'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path
            d="M3 2 L9 6 L3 10 Z"
            fill="currentColor"
            transform={open ? 'rotate(90 6 6)' : ''}
          />
        </svg>
      </button>
      <NodeViewContent className="toggle-content" />
    </NodeViewWrapper>
  );
}
