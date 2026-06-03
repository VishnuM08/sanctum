import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { SELECT_COLORS } from '../types';
import type { Database, DatabaseCellValue } from '../types';

interface Props {
  database: Database;
  rowId: string;
  onClose: () => void;
}

export function RowDetailModal({ database, rowId, onClose }: Props) {
  const updateDatabaseRow = useStore((s) => s.updateDatabaseRow);
  const deleteDatabaseRow = useStore((s) => s.deleteDatabaseRow);

  const row = database.rows.find((r) => r.id === rowId);
  const [values, setValues] = useState<Record<string, DatabaseCellValue>>(row?.values ?? {});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!row) return null;

  const save = (propId: string, value: DatabaseCellValue) => {
    const next = { ...values, [propId]: value };
    setValues(next);
    updateDatabaseRow(database.id, rowId, { [propId]: value });
  };

  return (
    <div className="row-detail-overlay" onClick={onClose}>
      <div className="row-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="row-detail-header">
          <div className="row-detail-title">
            {(values.title as string) || 'Untitled'}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              className="row-detail-action-btn"
              onClick={() => { deleteDatabaseRow(database.id, rowId); onClose(); }}
              title="Delete record"
            >
              <Trash2 size={14} />
            </button>
            <button className="row-detail-action-btn" onClick={onClose} title="Close">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Properties */}
        <div className="row-detail-body">
          {database.properties.map((prop) => {
            const val = values[prop.id] ?? null;

            return (
              <div key={prop.id} className="row-detail-prop">
                <div className="row-detail-prop-label">{prop.name}</div>
                <div className="row-detail-prop-value">
                  <PropEditor
                    prop={prop}
                    value={val}
                    onChange={(v) => save(prop.id, v)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Property editor ────────────────────────────────────────────────────────

interface PropEditorProps {
  prop: Database['properties'][0];
  value: DatabaseCellValue;
  onChange: (v: DatabaseCellValue) => void;
}

function PropEditor({ prop, value, onChange }: PropEditorProps) {
  switch (prop.type) {
    case 'title':
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return (
        <input
          className="row-detail-input"
          value={(value as string) ?? ''}
          placeholder={`Add ${prop.name.toLowerCase()}...`}
          onChange={(e) => onChange(e.target.value)}
          type={prop.type === 'url' ? 'url' : prop.type === 'email' ? 'email' : prop.type === 'phone' ? 'tel' : 'text'}
        />
      );

    case 'number':
      return (
        <input
          className="row-detail-input"
          type="number"
          value={(value as number) ?? ''}
          placeholder="0"
          onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        />
      );

    case 'date':
      return (
        <input
          className="row-detail-input"
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'checkbox':
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{value ? 'Checked' : 'Unchecked'}</span>
        </label>
      );

    case 'select': {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {!value && (
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>No option selected</span>
          )}
          {prop.options?.map((opt) => {
            const colors = SELECT_COLORS[opt.color];
            const isSelected = value === opt.name;
            return (
              <button
                key={opt.id}
                className="select-tag"
                style={{
                  background: isSelected ? colors.bg : 'var(--bg-hover)',
                  color: isSelected ? colors.text : 'var(--text-muted)',
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${colors.bg}` : '1px solid var(--border-strong)',
                  transition: 'all 150ms',
                }}
                onClick={() => onChange(isSelected ? null : opt.name)}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      );
    }

    case 'multiSelect': {
      const selected = (value as string[]) ?? [];
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {selected.length === 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>No options selected</span>
          )}
          {prop.options?.map((opt) => {
            const colors = SELECT_COLORS[opt.color];
            const isSelected = selected.includes(opt.name);
            return (
              <button
                key={opt.id}
                className="select-tag"
                style={{
                  background: isSelected ? colors.bg : 'var(--bg-hover)',
                  color: isSelected ? colors.text : 'var(--text-muted)',
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${colors.bg}` : '1px solid var(--border-strong)',
                  transition: 'all 150ms',
                }}
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((v) => v !== opt.name));
                  } else {
                    onChange([...selected, opt.name]);
                  }
                }}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return (
        <input
          className="row-detail-input"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
