import { Node, mergeAttributes, type CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from '../components/ImageBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      insertImageBlock: () => ReturnType;
    };
  }
}

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:     { default: null },
      alt:     { default: '' },
      caption: { default: '' },
      align:   { default: 'left' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'image-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },

  addCommands() {
    return {
      insertImageBlock: () => ({ commands }: CommandProps) =>
        commands.insertContent({ type: 'imageBlock', attrs: { src: null } }),
    };
  },
});
