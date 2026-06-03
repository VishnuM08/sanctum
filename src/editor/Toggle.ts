/*
 * Custom Toggle block (collapsible). In Notion this is "▶ Heading — click to
 * expand". Implementation strategy:
 *
 * - ToggleNode is a single block node whose content is `block+` (one or more
 *   blocks). The first child acts as the "summary" line; the rest are body.
 * - An `open` attribute (boolean) decides whether the body is visible.
 * - We render via a React NodeView (see ToggleView.tsx) so we can hook a
 *   click handler onto the arrow icon and toggle the attribute.
 *
 * Why a NodeView and not just renderHTML? Because we need interactive UI
 * inside the doc (the arrow button) that mutates the doc on click. renderHTML
 * is for static markup; NodeView gives us a stable React component instance
 * bound to a specific node + position.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ToggleView } from '../components/ToggleView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleBlock: {
      /** Insert an empty toggle at the current selection. */
      insertToggleBlock: () => ReturnType;
    };
  }
}

export const ToggleBlock = Node.create({
  name: 'toggleBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.getAttribute('data-open') !== 'false',
        renderHTML: (attrs) => ({ 'data-open': String(attrs.open) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },

  addCommands() {
    return {
      insertToggleBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { open: true },
            content: [{ type: 'paragraph' }, { type: 'paragraph' }],
          }),
    };
  },
});
