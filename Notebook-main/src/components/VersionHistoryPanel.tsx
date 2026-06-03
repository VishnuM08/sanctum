import { X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../store';
import type { Page, PageSnapshot } from '../types';

interface Props {
  page: Page;
  onRestore: (content: unknown) => void;
  onClose: () => void;
}

export function VersionHistoryPanel({ page, onRestore, onClose }: Props) {
  const saveSnapshot  = useStore((s) => s.saveSnapshot);
  const snapshots     = page.snapshots ?? [];

  const wordCount = (content: unknown): number => {
    try {
      const text = JSON.stringify(content).replace(/"type":"[^"]+",?/g, '').replace(/[{}\[\]"]/g, ' ');
      return text.trim().split(/\s+/).filter(Boolean).length;
    } catch { return 0; }
  };

  return (
    <div className="version-panel">
      <div className="version-panel-header">
        <span style={{ fontWeight: 600, fontSize: 14 }}>Version history</span>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
      </div>

      {snapshots.length === 0 ? (
        <div className="version-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <div>No saved versions yet.</div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-faint)' }}>
            Versions auto-save as you edit.
          </div>
          <button
            className="settings-btn primary"
            style={{ marginTop: 12, fontSize: 13 }}
            onClick={() => saveSnapshot(page.id, wordCount(page.content))}
          >
            Save version now
          </button>
        </div>
      ) : (
        <div className="version-list">
          {/* Current */}
          <div className="version-item current">
            <div className="version-item-label">
              <span className="version-badge">Current</span>
              <span className="version-time">Now</span>
            </div>
            <div className="version-words">{wordCount(page.content)} words</div>
          </div>

          {snapshots.map((snap, i) => (
            <SnapshotRow
              key={snap.id}
              snap={snap}
              isLatest={i === 0}
              onRestore={() => onRestore(snap.content)}
            />
          ))}
        </div>
      )}

      <div className="version-footer">
        <button
          className="settings-btn secondary"
          style={{ fontSize: 12, width: '100%' }}
          onClick={() => saveSnapshot(page.id, wordCount(page.content))}
        >
          📸 Save version now
        </button>
      </div>
    </div>
  );
}

function SnapshotRow({ snap, isLatest, onRestore }: {
  snap: PageSnapshot; isLatest: boolean; onRestore: () => void;
}) {
  const now  = Date.now();
  const diff = now - snap.savedAt;
  const label = diff < 60_000
    ? 'Just now'
    : diff < 3_600_000
    ? `${Math.round(diff / 60_000)} min ago`
    : format(snap.savedAt, 'MMM d, h:mm a');

  return (
    <div className="version-item">
      <div className="version-item-label">
        {isLatest && <span className="version-badge latest">Latest</span>}
        <span className="version-time">{label}</span>
      </div>
      <div className="version-words">{snap.wordCount} words</div>
      <div className="version-item-actions">
        <button
          className="version-btn"
          onClick={onRestore}
          title="Restore this version"
        >
          <RotateCcw size={12} /> Restore
        </button>
      </div>
    </div>
  );
}
