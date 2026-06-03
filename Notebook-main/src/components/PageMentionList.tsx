import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface Props {
  items: { id: string; title: string; icon: string }[];
  command: (item: { id: string; title: string; icon: string }) => void;
}

export const PageMentionList = forwardRef<MentionListHandle, Props>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelected((s) => (s - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelected((s) => (s + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[selected];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="slash-menu" style={{ width: 240 }}>
          <div className="slash-menu-empty">No matching pages</div>
        </div>
      );
    }

    return (
      <div className="slash-menu" style={{ width: 240, maxHeight: 240 }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`mention-list-item ${idx === selected ? 'selected' : ''}`}
            onMouseEnter={() => setSelected(idx)}
            onMouseDown={(e) => { e.preventDefault(); command(item); }}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{item.icon || '📄'}</span>
            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.title || 'Untitled'}</span>
          </div>
        ))}
      </div>
    );
  },
);

PageMentionList.displayName = 'PageMentionList';
