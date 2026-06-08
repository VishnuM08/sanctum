import { X, RotateCcw, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { NotionIcon } from './NotionIcon';

interface Props {
  onClose: () => void;
}

export function TrashModal({ onClose }: Props) {
  const pages = useStore((s) => s.pages);
  const deletedPages = pages.filter((p) => p.isDeleted);
  const restorePage = useStore((s) => s.restorePage);
  const permanentlyDeletePage = useStore((s) => s.permanentlyDeletePage);

  return (
    <div className="trash-modal-overlay" onClick={onClose}>
      <div className="trash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trash-modal-header">
          <span>🗑️ Trash</span>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="trash-modal-body">
          {deletedPages.length === 0 ? (
            <div className="trash-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
              <div>No pages in trash</div>
            </div>
          ) : (
            deletedPages.map((page) => (
              <div key={page.id} className="trash-item">
                <span className="trash-item-icon"><NotionIcon icon={page.icon || 'notion_page'} size="1.2em" /></span>
                <span className="trash-item-title">{page.title || 'Untitled'}</span>
                <div className="trash-item-actions">
                  <button
                    className="trash-item-btn restore"
                    onClick={() => restorePage(page.id)}
                    title="Restore page"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    className="trash-item-btn delete"
                    onClick={() => {
                      if (confirm('Permanently delete this page? This cannot be undone.')) {
                        permanentlyDeletePage(page.id);
                      }
                    }}
                    title="Delete permanently"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
