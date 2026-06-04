import { NotionIcon } from './NotionIcon';

const DOODLE_ICONS = [
  { key: 'notion_page', label: 'Document / Page' },
  { key: 'notion_happy', label: 'Smiling Face' },
  { key: 'notion_work', label: 'Work / Laptop' },
  { key: 'notion_party', label: 'Launch / Celebrate' },
  { key: 'notion_secure', label: 'Lock / Secure' },
  { key: 'notion_idea', label: 'Idea / Lightbulb' },
  { key: 'notion_love', label: 'Heart / Love' },
  { key: 'notion_calendar', label: 'Calendar / Schedule' },
  { key: 'notion_folder', label: 'Folder / Organization' },
  { key: 'notion_chat', label: 'Chat / Speech' },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onRemove?: () => void;
}

export function EmojiPicker({ onSelect, onClose, onRemove }: Props) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div className="emoji-picker" style={{ position: 'relative', zIndex: 50, width: '260px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Doodle Icon
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', padding: '4px 0' }}>
          {DOODLE_ICONS.map((item) => (
            <button
              key={item.key}
              className="emoji-btn"
              onClick={() => onSelect(item.key)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                height: '42px',
                width: '42px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover-strong)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-app)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <NotionIcon icon={item.key} size="28px" />
            </button>
          ))}
        </div>

        <div className="emoji-picker-actions" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          {onRemove && (
            <button className="emoji-picker-action" onClick={onRemove}>
              Remove
            </button>
          )}
          <button className="emoji-picker-action" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
