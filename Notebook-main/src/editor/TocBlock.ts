import { Node, mergeAttributes, type CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TocView } from '../components/TocView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tocBlock: { insertToc: () => ReturnType };
  }
}

export const TocBlock = Node.create({
  name: 'tocBlock',
  group: 'block',
  atom: true,

  parseHTML()  { return [{ tag: 'div[data-type="toc"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'toc' }, HTMLAttributes)];
  },

  addNodeView() { return ReactNodeViewRenderer(TocView); },

  addCommands() {
    return {
      insertToc: () => ({ commands }: CommandProps) =>
        commands.insertContent({ type: 'tocBlock' }),
    };
  },
});
