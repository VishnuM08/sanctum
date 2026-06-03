import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { SELECT_COLORS } from '../types';
import type { Database, DatabaseRow } from '../types';
import { RowDetailModal } from './RowDetailModal';

interface Props {
  database: Database;
  rows: DatabaseRow[];
}

export function ListView({ database, rows }: Props) {
  const addDatabaseRow = useStore((s) => s.addDatabaseRow);
  const [detailRowId, setDetailRowId] = useState<string | null>(null);

  const propCols = database.properties.filter((p) => p.id !== 'title' && !p.hidden).slice(0, 4);

  return (
    <>
      <div className="list-view">
        {rows.map((row) => (
          <ListRow
            key={row.id}
            row={row}
            database={database}
            propCols={propCols}
            onOpen={() => setDetailRowId(row.id)}
          />
        ))}

        <button className="list-add-row" onClick={() => addDatabaseRow(database.id)}>
          <Plus size={14} /> New row
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

interface ListRowProps {
  row: DatabaseRow;
  database: Database;
  propCols: Database['properties'];
  onOpen: () => void;
}

function ListRow({ row, database, propCols, onOpen }: ListRowProps) {
  void database;
  const title = (row.values.title as string) || 'Untitled';

  return (
    <div className="list-row" onClick={onOpen}>
      <span className="list-row-icon">📄</span>
      <span className="list-row-title">{title}</span>
      <div className="list-row-props">
        {propCols.map((prop) => {
          const val = row.values[prop.id];
          if (!val && val !== false && val !== 0) return null;

          if (prop.type === 'select') {
            const opt = prop.options?.find((o) => o.name === val);
            if (!opt) return null;
            const c = SELECT_COLORS[opt.color];
            return <span key={prop.id} className="select-tag" style={{ background: c.bg, color: c.text, fontSize: 11 }}>{opt.name}</span>;
          }

          if (prop.type === 'checkbox') return <span key={prop.id} style={{ fontSize: 13 }}>{val ? '✅' : ''}</span>;
          if (prop.type === 'number') return <span key={prop.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val as number}</span>;

          return null;
        })}
      </div>
    </div>
  );
}
