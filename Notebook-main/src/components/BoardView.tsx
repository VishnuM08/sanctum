import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { SELECT_COLORS } from '../types';
import type { Database, DatabaseView, DatabaseRow, SelectColor } from '../types';
import { RowDetailModal } from './RowDetailModal';

interface Props {
  database: Database;
  view: DatabaseView;
  rows: DatabaseRow[];
}

export function BoardView({ database, view, rows }: Props) {
  const addDatabaseRow = useStore((s) => s.addDatabaseRow);
  const moveBoardRow   = useStore((s) => s.moveBoardRow);
  const [detailRowId, setDetailRowId] = useState<string | null>(null);

  const groupProp =
    database.properties.find((p) => p.id === view.groupByPropertyId && p.type === 'select') ??
    database.properties.find((p) => p.type === 'select');

  if (!groupProp?.options) {
    return (
      <div className="board-view" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div>Add a Select property to use Board view</div>
        </div>
      </div>
    );
  }

  const columns = groupProp.options;

  const getColRows = (optName: string) => rows.filter((r) => r.values[groupProp.id] === optName);
  const unGrouped  = rows.filter((r) => {
    const v = r.values[groupProp.id];
    return !v || !columns.some((c) => c.name === v);
  });

  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    e.dataTransfer.setData('rowId', rowId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, optName: string) => {
    e.preventDefault();
    const rowId = e.dataTransfer.getData('rowId');
    if (rowId) moveBoardRow(database.id, rowId, optName, groupProp.id);
  };

  const visibleProps = database.properties.filter(
    (p) => p.id !== groupProp.id && p.id !== 'title' && !p.hidden,
  ).slice(0, 3);

  const allColumns = [
    { id: '__none__', name: 'No Status', color: 'gray' as SelectColor, isNone: true },
    ...columns.map((c) => ({ id: c.id, name: c.name, color: c.color, isNone: false })),
  ];

  return (
    <>
      <div className="board-view">
        {allColumns.map((col) => {
          const colRows = col.isNone ? unGrouped : getColRows(col.name);
          const colors  = SELECT_COLORS[col.color];

          return (
            <div
              key={col.id}
              className="board-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.name)}
            >
              <div className="board-column-header">
                {!col.isNone ? (
                  <span className="select-tag" style={{ background: colors.bg, color: colors.text }}>
                    {col.name}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{col.name}</span>
                )}
                <span className="board-column-count">{colRows.length}</span>
              </div>

              {colRows.map((row) => (
                <BoardCard
                  key={row.id}
                  row={row}
                  database={database}
                  visibleProps={visibleProps}
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onOpen={() => setDetailRowId(row.id)}
                />
              ))}

              <button
                className="board-add-card"
                onClick={() =>
                  addDatabaseRow(database.id, {
                    [groupProp.id]: col.isNone ? null : col.name,
                  })
                }
              >
                <Plus size={14} /> New
              </button>
            </div>
          );
        })}
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

// ── Board card ─────────────────────────────────────────────────────────────

interface BoardCardProps {
  row: DatabaseRow;
  database: Database;
  visibleProps: Database['properties'];
  onDragStart: (e: React.DragEvent) => void;
  onOpen: () => void;
}

function BoardCard({ row, database, visibleProps, onDragStart, onOpen }: BoardCardProps) {
  const updateDatabaseRow = useStore((s) => s.updateDatabaseRow);
  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState((row.values.title as string) ?? '');

  const handleTitleBlur = () => {
    setEditing(false);
    updateDatabaseRow(database.id, row.id, { title: titleVal });
  };

  return (
    <div
      className="board-card"
      draggable
      onDragStart={onDragStart}
      onDoubleClick={onOpen}
    >
      <div className="board-card-title">
        {editing ? (
          <input
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
            autoFocus
            style={{ width: '100%', fontSize: 14, fontWeight: 500, background: 'transparent' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'text', flex: 1 }}>
            {(row.values.title as string) || 'Untitled'}
          </span>
        )}
        <button
          style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, color: 'var(--text-faint)', padding: '1px 4px', borderRadius: 3, transition: 'background 150ms' }}
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Open record"
        >↗</button>
      </div>

      <div className="board-card-props">
        {visibleProps.map((prop) => {
          const val = row.values[prop.id];
          if (!val && val !== 0 && val !== false) return null;

          if (prop.type === 'select') {
            const opt = prop.options?.find((o) => o.name === val);
            if (!opt) return null;
            const c = SELECT_COLORS[opt.color];
            return <span key={prop.id} className="select-tag" style={{ background: c.bg, color: c.text, fontSize: 11 }}>{opt.name}</span>;
          }

          if (prop.type === 'multiSelect') {
            return (val as string[]).slice(0, 2).map((v) => {
              const opt = prop.options?.find((o) => o.name === v);
              if (!opt) return null;
              const c = SELECT_COLORS[opt.color];
              return <span key={v} className="select-tag" style={{ background: c.bg, color: c.text, fontSize: 11 }}>{v}</span>;
            });
          }

          if (prop.type === 'checkbox') {
            return <span key={prop.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val ? '✅' : '☐'} {prop.name}</span>;
          }

          if (prop.type === 'number') {
            return <span key={prop.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{prop.name}: {val as number}</span>;
          }

          return <span key={prop.id} style={{ fontSize: 12, color: 'var(--text-muted)' }}>{String(val)}</span>;
        })}
      </div>
    </div>
  );
}
