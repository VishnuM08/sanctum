import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { SlashItem } from '../editor/slashCommands';
import type { SlashMenuProps } from '../editor/SlashCommand';
import { NotionIcon } from './NotionIcon';

/**
 * Imperative handle the slash-command extension calls into. We can't rely
 * on the editor's keymap to drive the menu because Suggestion intercepts
 * keys *before* keymap-bound shortcuts run — so the extension forwards
 * relevant keys here and we return true/false to signal "handled".
 */
export interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Whenever the filtered item list changes (user typed more chars), reset
    // selection so we don't point past the end of a shorter list.
    useEffect(() => setSelected(0), [items]);

    const pick = (idx: number) => {
      const item = items[idx];
      if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (event.key === 'ArrowUp') {
          setSelected((s) => (s - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          pick(selected);
          return true;
        }
        return false;
      },
    }));

    // Keep the highlighted row visible if the user scrolls past it.
    useEffect(() => {
      const el = listRef.current?.querySelector<HTMLElement>(
        `[data-idx="${selected}"]`,
      );
      el?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    if (items.length === 0) {
      return (
        <div className="slash-menu">
          <div className="slash-menu-empty">No matching blocks</div>
        </div>
      );
    }

    return (
      <div className="slash-menu" ref={listRef}>
        <div className="slash-menu-header">Basic blocks</div>
        {items.map((item, idx) => (
          <Row
            key={item.title}
            item={item}
            idx={idx}
            selected={idx === selected}
            onHover={() => setSelected(idx)}
            onClick={() => pick(idx)}
          />
        ))}
      </div>
    );
  },
);

SlashMenu.displayName = 'SlashMenu';

interface RowProps {
  item: SlashItem;
  idx: number;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}

function Row({ item, idx, selected, onHover, onClick }: RowProps) {
  return (
    <div
      data-idx={idx}
      className={`slash-menu-item ${selected ? 'selected' : ''}`}
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        // mousedown (not click) so the editor selection doesn't blur first
        // and lose the range we need to insert into.
        e.preventDefault();
        onClick();
      }}
    >
      <span className="icon"><NotionIcon icon={item.icon} size="1.2em" /></span>
      <span className="meta">
        <span className="label">{item.title}</span>
        <span className="desc">{item.description}</span>
      </span>
    </div>
  );
}
