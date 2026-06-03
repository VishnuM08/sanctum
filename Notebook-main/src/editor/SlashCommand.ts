/*
 * Hand-rolled slash-command extension on top of TipTap's @tiptap/suggestion
 * primitive. ProseMirror's "suggestion" plugin watches the document for a
 * trigger char (here '/') and emits lifecycle events: onStart when the user
 * types it, onUpdate while they keep typing, onKeyDown for navigation keys,
 * and onExit when the popup should close.
 *
 * We bridge those events to a React component (SlashMenu) using TipTap's
 * ReactRenderer (which mounts React imperatively into a detached DOM node)
 * and position the node with tippy.js so it tracks the caret. The component
 * exposes an imperative onKeyDown via useImperativeHandle so this extension
 * can forward ArrowUp/Down/Enter into it without React owning the keyboard
 * event flow.
 */
import { Extension, type Editor, type Range } from '@tiptap/core';
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
  type SuggestionKeyDownProps,
} from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance, type GetReferenceClientRect } from 'tippy.js';
import { SlashMenu, type SlashMenuRef } from '../components/SlashMenu';
import { filterSlashItems, type SlashItem } from './slashCommands';

/**
 * What the suggestion plugin hands to our React component. We expose a single
 * `command` callback that runs the picked item — Suggestion populates the
 * `range` for us so the slash-text gets removed before the block is inserted.
 */
export interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions<SlashItem>, 'editor'>;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        // Allow `/` at the start of any new line OR after whitespace. Without
        // this, '/' in the middle of a word would also trigger the menu.
        startOfLine: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashItem;
        }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => filterSlashItems(query),
        render: () => {
          let component: ReactRenderer<SlashMenuRef, SlashMenuProps>;
          let popup: Instance[] | null = null;

          return {
            onStart: (props: SuggestionProps<SlashItem>) => {
              component = new ReactRenderer<SlashMenuRef, SlashMenuProps>(
                SlashMenu,
                {
                  props: { items: props.items, command: props.command },
                  editor: props.editor,
                },
              );

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect:
                  props.clientRect as GetReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'slash',
                offset: [0, 8],
              });
            },

            onUpdate: (props: SuggestionProps<SlashItem>) => {
              component.updateProps({
                items: props.items,
                command: props.command,
              });

              if (!popup || !props.clientRect) return;

              popup[0].setProps({
                getReferenceClientRect:
                  props.clientRect as GetReferenceClientRect,
              });
            },

            onKeyDown: (props: SuggestionKeyDownProps): boolean => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              // Hand the key off to the React component so it can move its
              // selection or trigger the chosen item.
              return component.ref?.onKeyDown(props.event) ?? false;
            },

            onExit: () => {
              popup?.[0]?.destroy();
              component?.destroy();
              popup = null;
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
