import { Extension, type Editor } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { PageMentionList, type MentionListHandle } from '../components/PageMentionList';
// Inline mention mark — renders as a clickable chip
import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageMentionMark: {
      insertPageMention: (pageId: string, title: string, icon: string) => ReturnType;
    };
  }
}

export const PageMentionMark = Mark.create({
  name: 'pageMentionMark',
  priority: 1001,
  keepOnSplit: false,
  exitable: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title:  { default: '' },
      icon:   { default: '📄' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-page-id]' }];
  },

  renderHTML({ HTMLAttributes, mark }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-page-id': mark.attrs.pageId,
        class: 'page-mention-chip',
      }),
      `${mark.attrs.icon} ${mark.attrs.title}`,
    ];
  },

  addCommands() {
    return {
      insertPageMention: (pageId, title, icon) => ({ commands }) =>
        commands.insertContent({
          type: 'text',
          text: `${icon} ${title}`,
          marks: [{ type: 'pageMentionMark', attrs: { pageId, title, icon } }],
        }),
    };
  },
});

// The suggestion extension that triggers on @
export function buildPageMentionExtension(getPages: () => { id: string; title: string; icon: string }[]) {
  return Extension.create({
    name: 'pageMention',

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor as Editor,
          pluginKey: new PluginKey('page-mention'),
          char: '@',
          allowSpaces: false,
          startOfLine: false,

          items: ({ query }) => {
            const pages = getPages();
            const q = query.toLowerCase();
            return pages.filter((p) =>
              (p.title || 'Untitled').toLowerCase().includes(q),
            ).slice(0, 8);
          },

          render: () => {
            let component: ReactRenderer<MentionListHandle>;
            let popup: TippyInstance[];

            return {
              onStart: (props) => {
                component = new ReactRenderer(PageMentionList, {
                  props,
                  editor: props.editor,
                });
                if (!props.clientRect) return;
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  theme: 'slash',
                });
              },
              onUpdate: (props) => {
                component.updateProps(props);
                if (props.clientRect) {
                  popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
                }
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true; }
                return component.ref?.onKeyDown(props) ?? false;
              },
              onExit: () => {
                popup?.[0]?.destroy();
                component.destroy();
              },
            };
          },

          command: ({ editor, range, props }) => {
            editor.chain()
              .focus()
              .deleteRange(range)
              .insertPageMention(props.id, props.title || 'Untitled', props.icon || '📄')
              .insertContent(' ')
              .run();
          },
        }),
      ];
    },
  });
}
