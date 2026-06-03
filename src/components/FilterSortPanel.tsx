import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useStore } from '../store';
import { FILTER_CONDITIONS } from '../utils/databaseUtils';
import type { Database, DatabaseFilterConfig, DatabaseSortConfig } from '../types';

interface Props {
  database: Database;
  viewId: string;
  mode: 'filter' | 'sort';
  onClose: () => void;
}

export function FilterSortPanel({ database, viewId, mode, onClose }: Props) {
  const updateDatabaseViewFilters = useStore((s) => s.updateDatabaseViewFilters);
  const updateDatabaseViewSorts = useStore((s) => s.updateDatabaseViewSorts);
  const view = database.views.find((v) => v.id === viewId);

  const filters: DatabaseFilterConfig[] = view?.filters ?? [];
  const sorts: DatabaseSortConfig[] = view?.sorts ?? [];

  const editableProps = database.properties.filter((p) => p.type !== 'title');
  const allProps = database.properties;

  // ── Filter helpers ──────────────────────────────────────────────────────

  const addFilter = () => {
    const prop = editableProps[0] ?? allProps[0];
    if (!prop) return;
    const conditions = FILTER_CONDITIONS[prop.type]?.conditions ?? [];
    const newFilter: DatabaseFilterConfig = {
      propertyId: prop.id,
      condition: conditions[0]?.value ?? 'contains',
      value: null,
    };
    updateDatabaseViewFilters(database.id, viewId, [...filters, newFilter]);
  };

  const updateFilter = (idx: number, patch: Partial<DatabaseFilterConfig>) => {
    const updated = filters.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    updateDatabaseViewFilters(database.id, viewId, updated);
  };

  const removeFilter = (idx: number) => {
    updateDatabaseViewFilters(database.id, viewId, filters.filter((_, i) => i !== idx));
  };

  // ── Sort helpers ─────────────────────────────────────────────────────────

  const addSort = () => {
    const prop = allProps[0];
    if (!prop) return;
    // Don't duplicate
    if (sorts.some((s) => s.propertyId === prop.id)) return;
    updateDatabaseViewSorts(database.id, viewId, [...sorts, { propertyId: prop.id, direction: 'asc' }]);
  };

  const updateSort = (idx: number, patch: Partial<DatabaseSortConfig>) => {
    const updated = sorts.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    updateDatabaseViewSorts(database.id, viewId, updated);
  };

  const removeSort = (idx: number) => {
    updateDatabaseViewSorts(database.id, viewId, sorts.filter((_, i) => i !== idx));
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={onClose} />
      <div
        className="filter-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'filter' ? (
          <>
            <div className="filter-panel-title">Filter by</div>

            {filters.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-faint)' }}>
                No filters applied
              </div>
            )}

            {filters.map((filter, idx) => {
              const prop = allProps.find((p) => p.id === filter.propertyId);
              const condDef = FILTER_CONDITIONS[prop?.type ?? 'text'];
              const needsValue = !['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(filter.condition);

              return (
                <div key={idx} className="filter-row">
                  {/* Property selector */}
                  <select
                    className="filter-select"
                    value={filter.propertyId}
                    onChange={(e) => {
                      const newProp = allProps.find((p) => p.id === e.target.value);
                      const firstCond = FILTER_CONDITIONS[newProp?.type ?? 'text']?.conditions[0]?.value ?? 'contains';
                      updateFilter(idx, { propertyId: e.target.value, condition: firstCond, value: null });
                    }}
                  >
                    {allProps.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  {/* Condition selector */}
                  <select
                    className="filter-select"
                    value={filter.condition}
                    onChange={(e) => updateFilter(idx, { condition: e.target.value, value: null })}
                  >
                    {(condDef?.conditions ?? []).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  {/* Value input */}
                  {needsValue && prop && (
                    prop.type === 'select' || prop.type === 'multiSelect' ? (
                      <select
                        className="filter-select"
                        value={String(filter.value ?? '')}
                        onChange={(e) => updateFilter(idx, { value: e.target.value })}
                      >
                        <option value="">— pick —</option>
                        {prop.options?.map((o) => (
                          <option key={o.id} value={o.name}>{o.name}</option>
                        ))}
                      </select>
                    ) : prop.type === 'checkbox' ? null : (
                      <input
                        className="filter-input"
                        type={prop.type === 'number' ? 'number' : prop.type === 'date' ? 'date' : 'text'}
                        placeholder="Value..."
                        value={String(filter.value ?? '')}
                        onChange={(e) => updateFilter(idx, { value: e.target.value || null })}
                      />
                    )
                  )}

                  <button className="filter-remove-btn" onClick={() => removeFilter(idx)}>
                    <X size={13} />
                  </button>
                </div>
              );
            })}

            <button className="filter-add-btn" onClick={addFilter}>
              <Plus size={13} /> Add filter
            </button>
          </>
        ) : (
          <>
            <div className="filter-panel-title">Sort by</div>

            {sorts.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-faint)' }}>
                No sorts applied
              </div>
            )}

            {sorts.map((sort, idx) => (
              <div key={idx} className="filter-row">
                <select
                  className="filter-select"
                  value={sort.propertyId}
                  onChange={(e) => updateSort(idx, { propertyId: e.target.value })}
                >
                  {allProps.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <button
                  className="filter-select"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'var(--bg-hover)', border: '1px solid var(--border-strong)', borderRadius: 4, padding: '4px 8px' }}
                  onClick={() => updateSort(idx, { direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                >
                  {sort.direction === 'asc'
                    ? <><ArrowUp size={12} /> Ascending</>
                    : <><ArrowDown size={12} /> Descending</>
                  }
                </button>

                <button className="filter-remove-btn" onClick={() => removeSort(idx)}>
                  <X size={13} />
                </button>
              </div>
            ))}

            <button className="filter-add-btn" onClick={addSort}>
              <Plus size={13} /> Add sort
            </button>
          </>
        )}
      </div>
    </>
  );
}
