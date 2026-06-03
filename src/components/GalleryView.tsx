import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { SELECT_COLORS, COVER_GRADIENTS } from '../types';
import type { Database, DatabaseRow } from '../types';
import { RowDetailModal } from './RowDetailModal';

interface Props {
  database: Database;
  rows: DatabaseRow[];
}

export function GalleryView({ database, rows }: Props) {
  const addDatabaseRow = useStore((s) => s.addDatabaseRow);
  const [detailRowId, setDetailRowId] = useState<string | null>(null);

  const visibleProps = database.properties.filter((p) => p.id !== 'title' && !p.hidden).slice(0, 3);

  return (
    <>
      <div className="gallery-view">
        {rows.map((row, idx) => (
          <GalleryCard
            key={row.id}
            row={row}
            database={database}
            coverGradient={COVER_GRADIENTS[idx % COVER_GRADIENTS.length]}
            visibleProps={visibleProps}
            onOpen={() => setDetailRowId(row.id)}
          />
        ))}

        <button className="gallery-add-card" onClick={() => addDatabaseRow(database.id)}>
          <Plus size={18} /> New
        </button>
      </div>

      {detailRowId && (
        <RowDetailModal
          database={database}
          rowId={detailRowId}
          onClose={() => setDetailRowId(null)}
        />
      )}
    </>
  );
}

interface GalleryCardProps {
  row: DatabaseRow;
  database: Database;
  coverGradient: string;
  visibleProps: Database['properties'];
  onOpen: () => void;
}

function GalleryCard({ row, database, coverGradient, visibleProps, onOpen }: GalleryCardProps) {
  void database;
  const title = (row.values.title as string) || 'Untitled';

  return (
    <div className="gallery-card" onClick={onOpen}>
      <div className="gallery-card-cover" style={{ background: coverGradient }}>
        <span style={{ fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {getEmoji(row.values.title as string)}
        </span>
      </div>

      <div className="gallery-card-body">
        <div className="gallery-card-title">{title}</div>
        <div className="gallery-card-props">
          {visibleProps.map((prop) => {
            const val = row.values[prop.id];
            if (!val && val !== 0 && val !== false) return null;

            if (prop.type === 'select') {
              const opt = prop.options?.find((o) => o.name === val);
              if (!opt) return null;
              const c = SELECT_COLORS[opt.color];
              return <span key={prop.id} className="select-tag" style={{ background: c.bg, color: c.text, fontSize: 11 }}>{opt.name}</span>;
            }

            if (prop.type === 'number') {
              return <span key={prop.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{'★'.repeat(Math.min(Math.round(val as number), 5))}</span>;
            }

            if (prop.type === 'checkbox') {
              return <span key={prop.id} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{val ? '✅ Read' : '📖 Unread'}</span>;
            }

            if (prop.type === 'text') {
              return <span key={prop.id} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>{String(val)}</span>;
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

function getEmoji(title: string): string {
  const t = (title ?? '').toLowerCase();
  if (t.includes('pragmatic') || t.includes('design') || t.includes('everyday')) return '💻';
  if (t.includes('clean')) return '✨';
  if (t.includes('dune')) return '🚀';
  if (t.includes('sapiens') || t.includes('fast') || t.includes('slow')) return '🧠';
  return '📖';
}
