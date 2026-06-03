import { useState, useRef, useCallback } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { SELECT_COLORS } from '../types';
import type { Database, DatabaseProperty, DatabaseRow, DatabaseCellValue } from '../types';
import { format } from 'date-fns';
import { RowDetailModal } from './RowDetailModal';
import { AddColumnDialog } from './AddColumnDialog';

interface Props {
  database: Database;
  rows: DatabaseRow[];
}

export function TableView({ database, rows }: Props) {
  const addDatabaseRow  = useStore((s) => s.addDatabaseRow);
  const updateDatabase  = useStore((s) => s.updateDatabase);
  const [detailRowId,   setDetailRowId]   = useState<string | null>(null);
  const [addColOpen,    setAddColOpen]    = useState(false);
  const [renamingPropId, setRenamingPropId] = useState<string | null>(null);
  const [renameValue,   setRenameValue]   = useState('');

  const startRename = (prop: DatabaseProperty) => {
    setRenamingPropId(prop.id);
    setRenameValue(prop.name);
  };
  const commitRename = () => {
    if (!renamingPropId || !renameValue.trim()) { setRenamingPropId(null); return; }
    updateDatabase(database.id, {
      properties: database.properties.map((p) =>
        p.id === renamingPropId ? { ...p, name: renameValue.trim() } : p,
      ),
    });
    setRenamingPropId(null);
  };

  const visibleProps = database.properties.filter((p) => !p.hidden);

  // Column resize logic
  const resizingProp = useRef<string | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  const onResizeStart = useCallback((e: React.MouseEvent, propId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingProp.current = propId;
    resizeStartX.current = e.clientX;
    resizeStartW.current = currentWidth;

    const onMove = (ev: MouseEvent) => {
      if (!resizingProp.current) return;
      const newW = Math.max(60, resizeStartW.current + (ev.clientX - resizeStartX.current));
      updateDatabase(database.id, {
        properties: database.properties.map((p) =>
          p.id === resizingProp.current ? { ...p, width: newW } : p,
        ),
      });
    };
    const onUp = () => {
      resizingProp.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [database.id, database.properties, updateDatabase]);

  return (
    <div className="table-view">
      <table>
        <thead>
          <tr>
            {visibleProps.map((prop) => (
              <th key={prop.id} style={{ minWidth: prop.width, width: prop.width, position: 'relative' }}>
                <div
                  className="table-header-cell"
                  onDoubleClick={() => startRename(prop)}
                >
                  <PropertyTypeIcon type={prop.type} />
                  {renamingPropId === prop.id ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingPropId(null); }}
                      autoFocus
                      style={{ fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', outline: 'none', flex: 1, minWidth: 0 }}
                    />
                  ) : (
                    <span>{prop.name}</span>
                  )}
                  <ChevronDown size={12} style={{ marginLeft: 'auto', color: 'var(--text-faint)' }} />
                </div>
                <div className="col-resize-handle" onMouseDown={(e) => onResizeStart(e, prop.id, prop.width)} />
              </th>
            ))}
            <th style={{ width: 40, padding: 0, border: 'none', position: 'relative' }}>
              <button className="table-add-col" title="Add property" onClick={() => setAddColOpen(true)}>+</button>
              {addColOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 55 }}>
                  <AddColumnDialog database={database} onClose={() => setAddColOpen(false)} />
                </div>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              properties={visibleProps}
              database={database}
              onOpenDetail={() => setDetailRowId(row.id)}
            />
          ))}
        </tbody>
      </table>

      <button className="table-add-row" onClick={() => addDatabaseRow(database.id)}>
        <Plus size={14} /> New row
      </button>

      {detailRowId && (
        <RowDetailModal database={database} rowId={detailRowId} onClose={() => setDetailRowId(null)} />
      )}
    </div>
  );
}

// ── Table row ────────────────────────────────────────────────────────────────

function TableRow({ row, properties, database, onOpenDetail }: {
  row: DatabaseRow; properties: DatabaseProperty[];
  database: Database; onOpenDetail: () => void;
}) {
  const updateDatabaseRow = useStore((s) => s.updateDatabaseRow);
  return (
    <tr style={{ cursor: 'pointer' }} onDoubleClick={onOpenDetail}>
      {properties.map((prop, idx) => (
        <td key={prop.id}>
          <TableCell
            prop={prop}
            value={row.values[prop.id] ?? null}
            onChange={(v) => updateDatabaseRow(database.id, row.id, { [prop.id]: v })}
            isTitle={idx === 0}
            onOpenDetail={onOpenDetail}
          />
        </td>
      ))}
      <td />
    </tr>
  );
}

// ── Table cell ────────────────────────────────────────────────────────────────

function TableCell({ prop, value, onChange, isTitle, onOpenDetail }: {
  prop: DatabaseProperty; value: DatabaseCellValue;
  onChange: (v: DatabaseCellValue) => void;
  isTitle?: boolean; onOpenDetail?: () => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (prop.type === 'select' || prop.type === 'multiSelect') { setSelectOpen(true); return; }
    if (prop.type !== 'checkbox') { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }
  };

  const renderView = () => {
    switch (prop.type) {
      case 'title': case 'text': case 'url': case 'email': case 'phone':
        return <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>{(value as string) || (isTitle ? 'Untitled' : '')}</span>;
      case 'number':
        return <span>{value !== null && value !== undefined ? (value as number) : ''}</span>;
      case 'checkbox':
        return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }} onClick={(e) => e.stopPropagation()} />;
      case 'date':
        return <span>{value ? format(new Date(value as string), 'MMM d, yyyy') : ''}</span>;
      case 'select': {
        const opt = prop.options?.find((o) => o.name === value);
        if (!opt) return <span />;
        const c = SELECT_COLORS[opt.color];
        return <span className="select-tag" style={{ background: c.bg, color: c.text }}>{opt.name}</span>;
      }
      case 'multiSelect':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {((value as string[]) ?? []).map((v) => {
              const opt = prop.options?.find((o) => o.name === v);
              if (!opt) return null;
              const c = SELECT_COLORS[opt.color];
              return <span key={v} className="select-tag" style={{ background: c.bg, color: c.text }}>{v}</span>;
            })}
          </div>
        );
      default: return <span>{String(value ?? '')}</span>;
    }
  };

  const renderEditor = () => {
    switch (prop.type) {
      case 'title': case 'text': case 'url': case 'email': case 'phone':
        return <input ref={inputRef} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)} style={{ width: '100%', fontSize: 14, fontWeight: isTitle ? 500 : 400 }} />;
      case 'number':
        return <input ref={inputRef} type="number" value={(value as number) ?? ''} onChange={(e) => onChange(e.target.valueAsNumber || 0)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)} style={{ width: '100%', fontSize: 14 }} />;
      case 'date':
        return <input ref={inputRef} type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} style={{ width: '100%', fontSize: 14 }} />;
      default: return null;
    }
  };

  return (
    <div className={`table-cell ${isTitle ? 'table-cell-title' : ''}`} onClick={startEdit} style={{ minWidth: prop.width, position: 'relative' }}>
      {isTitle && (
        <button
          style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-faint)', marginRight: 4, padding: '1px 4px', borderRadius: 3, transition: 'background 150ms' }}
          onClick={(e) => { e.stopPropagation(); onOpenDetail?.(); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Open record"
        >↗</button>
      )}
      {editing ? renderEditor() : renderView()}
      {selectOpen && prop.options && (
        <SelectDropdown prop={prop} value={value} onChange={onChange} onClose={() => setSelectOpen(false)} />
      )}
    </div>
  );
}

function SelectDropdown({ prop, value, onChange, onClose }: {
  prop: DatabaseProperty; value: DatabaseCellValue;
  onChange: (v: DatabaseCellValue) => void; onClose: () => void;
}) {
  const isMulti  = prop.type === 'multiSelect';
  const selected = isMulti ? ((value as string[]) ?? []) : (value as string ?? '');
  const toggle = (name: string) => {
    if (isMulti) {
      const arr = selected as string[];
      onChange(arr.includes(name) ? arr.filter((v) => v !== name) : [...arr, name]);
    } else { onChange(selected === name ? null : name); onClose(); }
  };
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />
      <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50 }} onClick={(e) => e.stopPropagation()}>
        {prop.options?.map((opt) => {
          const c = SELECT_COLORS[opt.color];
          const isSel = isMulti ? (selected as string[]).includes(opt.name) : selected === opt.name;
          return (
            <button key={opt.id} className="dropdown-item" onClick={() => toggle(opt.name)}>
              <span className="select-tag" style={{ background: c.bg, color: c.text }}>{opt.name}</span>
              {isSel && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function PropertyTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = { title: 'T', text: '≡', number: '#', select: '◉', multiSelect: '⊕', date: '📅', checkbox: '☑', url: '🔗', email: '✉', phone: '📞' };
  return <span style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0, minWidth: 14 }}>{icons[type] ?? '?'}</span>;
}
