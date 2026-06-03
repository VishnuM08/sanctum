import { useEffect } from 'react';
import { X, Bell, MessageCircle, Edit3, Clock } from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

interface Props { onClose: () => void }

const TYPE_ICONS = {
  mention:  <MessageCircle size={14} style={{ color: '#2383e2' }} />,
  edit:     <Edit3 size={14} style={{ color: '#448361' }} />,
  reminder: <Clock size={14} style={{ color: '#cc772f' }} />,
  comment:  <MessageCircle size={14} style={{ color: '#9065b0' }} />,
};

export function InboxModal({ onClose }: Props) {
  const inboxItems    = useStore((s) => s.inboxItems);
  const markInboxRead = useStore((s) => s.markInboxRead);
  const navigateToPage = useStore((s) => s.navigateToPage);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Mark all read when inbox opens
    setTimeout(markInboxRead, 1500);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, markInboxRead]);

  const unread = inboxItems.filter((i) => !i.read).length;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="inbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inbox-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={15} />
            <span>Updates</span>
            {unread > 0 && <span className="filter-badge">{unread}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={markInboxRead}>
              Mark all read
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
          </div>
        </div>

        <div className="inbox-body">
          {inboxItems.length === 0 && (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              You're all caught up!
            </div>
          )}

          {inboxItems.map((item) => (
            <div
              key={item.id}
              className={`inbox-item ${item.read ? '' : 'unread'}`}
              onClick={() => { if (item.pageId) { navigateToPage(item.pageId); onClose(); } }}
            >
              <div className="inbox-item-icon">
                {TYPE_ICONS[item.type]}
              </div>
              <div className="inbox-item-body">
                <div className="inbox-item-title">{item.title}</div>
                <div className="inbox-item-time">
                  {formatDistanceToNow(item.time, { addSuffix: true })}
                </div>
              </div>
              {!item.read && <div className="inbox-unread-dot" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
