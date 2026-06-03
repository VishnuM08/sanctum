/*
 * Callout block — emoji + tinted background containing arbitrary blocks.
 * Single attribute (emoji); content is `block+`. NodeView renders the emoji
 * as a clickable button so users can swap it; the picker UI lives in the
 * CalloutView component.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CalloutView } from '../components/CalloutView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBlock: {
      insertCalloutBlock: (emoji?: string) => ReturnType;
    };
  }
}

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: '\u{1F4A1}',
        parseHTML: (el) => el.getAttribute('data-emoji') || '\u{1F4A1}',
        renderHTML: (attrs) => ({ 'data-emoji': attrs.emoji }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      insertCalloutBlock:
        (emoji = '\u{1F4A1}') =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { emoji },
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});
