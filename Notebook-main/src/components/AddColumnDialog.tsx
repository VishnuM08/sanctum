import { X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useStore } from '../store';
import type { Database, PropertyType } from '../types';

interface Props {
  database: Database;
  onClose: () => void;
}

const PROPERTY_TYPES: { type: PropertyType; icon: string; label: string; desc: string }[] = [
  { type: 'text',        icon: '≡', label: 'Text',         desc: 'Short text, names, notes' },
  { type: 'number',      icon: '#', label: 'Number',        desc: 'Integers and decimals' },
  { type: 'select',      icon: '◉', label: 'Select',        desc: 'One option from a list' },
  { type: 'multiSelect', icon: '⊕', label: 'Multi-select',  desc: 'Multiple options from a list' },
  { type: 'date',        icon: '📅', label: 'Date',          desc: 'A specific date or date range' },
  { type: 'checkbox',    icon: '☑', label: 'Checkbox',      desc: 'True or false toggle' },
  { type: 'url',         icon: '🔗', label: 'URL',           desc: 'Web links' },
  { type: 'email',       icon: '✉', label: 'Email',         desc: 'Email addresses' },
  { type: 'phone',       icon: '📞', label: 'Phone',         desc: 'Phone numbers' },
];

export function AddColumnDialog({ database, onClose }: Props) {
  const updateDatabase = useStore((s) => s.updateDatabase);

  const addColumn = (type: PropertyType, label: string) => {
    const newProp = {
      id: nanoid(),
      name: label,
      type,
      width: 140,
      hidden: false,
      ...(type === 'select' || type === 'multiSelect' ? { options: [] } : {}),
    };
    updateDatabase(database.id, {
      properties: [...database.properties, newProp],
    });
    onClose();
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 54 }} onClick={onClose} />
      <div className="add-col-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-col-header">
          <span style={{ fontWeight: 600, fontSize: 14 }}>Add property</span>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
        </div>
        <div className="add-col-list">
          {PROPERTY_TYPES.map(({ type, icon, label, desc }) => (
            <button
              key={type}
              className="add-col-item"
              onClick={() => addColumn(type, label)}
            >
              <span className="add-col-icon">{icon}</span>
              <div>
                <div className="add-col-label">{label}</div>
                <div className="add-col-desc">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
