import { useState } from 'react';
import {
  Table2, LayoutGrid, Columns, List, Calendar, AlignLeft,
  Filter, SortAsc, EyeOff, Plus, X,
} from 'lucide-react';
import { useStore } from '../store';
import { applyFiltersAndSorts } from '../utils/databaseUtils';
import { TableView } from './TableView';
import { BoardView } from './BoardView';
import { GalleryView } from './GalleryView';
import { ListView } from './ListView';
import { CalendarView } from './CalendarView';
import { FilterSortPanel } from './FilterSortPanel';
import type { Database, DatabaseViewType } from '../types';

const VIEW_ICONS: Record<DatabaseViewType, React.ReactNode> = {
  table:    <Table2 size={13} />,
  board:    <Columns size={13} />,
  gallery:  <LayoutGrid size={13} />,
  list:     <List size={13} />,
  calendar: <Calendar size={13} />,
  timeline: <AlignLeft size={13} />,
};

const VIEW_LABELS: Record<DatabaseViewType, string> = {
  table: 'Table', board: 'Board', gallery: 'Gallery',
  list: 'List', calendar: 'Calendar', timeline: 'Timeline',
};

interface Props {
  database: Database;
}

export function DatabaseView({ database }: Props) {
  const updateDatabase = useStore((s) => s.updateDatabase);
  const setDatabaseView = useStore((s) => s.setDatabaseView);
  const addDatabaseRow = useStore((s) => s.addDatabaseRow);

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(database.title);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showHide, setShowHide] = useState(false);

  const activeView = database.views.find((v) => v.id === database.activeViewId)
    ?? database.views[0];

  const filters = activeView?.filters ?? [];
  const sorts   = activeView?.sorts   ?? [];

  // Compute filtered+sorted rows once here; pass to all sub-views
  const processedRows = applyFiltersAndSorts(
    database.rows,
    filters,
    sorts,
    database.properties,
  );

  const handleTitleBlur = () => {
    setTitleEditing(false);
    if (titleValue !== database.title) updateDatabase(database.id, { title: titleValue });
  };

  const togglePropertyVisibility = (propId: string) => {
    updateDatabase(database.id, {
      properties: database.properties.map((p) =>
        p.id === propId ? { ...p, hidden: !p.hidden } : p,
      ),
    });
  };

  const renderContent = () => {
    if (!activeView) return null;
    switch (activeView.type) {
      case 'table':    return <TableView database={database} rows={processedRows} />;
      case 'board':    return <BoardView database={database} view={activeView} rows={processedRows} />;
      case 'gallery':  return <GalleryView database={database} rows={processedRows} />;
      case 'list':     return <ListView database={database} rows={processedRows} />;
      case 'calendar': return <CalendarView database={database} rows={processedRows} />;
      case 'timeline': return (
        <div className="calendar-view">
          <div style={{ fontSize: 40 }}>📊</div>
          <div style={{ fontWeight: 600 }}>Timeline View</div>
          <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Coming soon — switch to Table or Board view</div>
        </div>
      );
      default: return <TableView database={database} rows={processedRows} />;
    }
  };

  return (
    <div className="database-container">
      {/* Header */}
      <div className="database-header">
        <div className="database-title">
          <span>{database.icon}</span>
          {titleEditing ? (
            <input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
              autoFocus
            />
          ) : (
            <span onClick={() => setTitleEditing(true)} style={{ cursor: 'text', flex: 1 }}>
              {database.title}
            </span>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="database-views-tabs">
        {database.views.map((view) => (
          <button
            key={view.id}
            className={`db-view-tab ${view.id === database.activeViewId ? 'active' : ''}`}
            onClick={() => { setDatabaseView(database.id, view.id); setShowFilter(false); setShowSort(false); }}
          >
            {VIEW_ICONS[view.type]}
            <span>{view.name || VIEW_LABELS[view.type]}</span>
          </button>
        ))}
        <button
          className="db-view-tab"
          onClick={() => {
            const id = Math.random().toString(36).slice(2);
            updateDatabase(database.id, {
              views: [...database.views, { id, name: 'New View', type: 'table', sorts: [], filters: [], hiddenPropertyIds: [] }],
              activeViewId: id,
            });
          }}
          style={{ color: 'var(--text-faint)' }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="database-toolbar" style={{ position: 'relative' }}>
        {/* Filter button */}
        <div style={{ position: 'relative' }}>
          <button
            className={`db-toolbar-btn ${filters.length > 0 ? 'active-filter' : ''}`}
            onClick={() => { setShowFilter((v) => !v); setShowSort(false); setShowHide(false); }}
          >
            <Filter size={13} />
            Filter
            {filters.length > 0 && (
              <span className="filter-badge">{filters.length}</span>
            )}
          </button>
          {showFilter && activeView && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 45 }}>
              <FilterSortPanel
                database={database}
                viewId={activeView.id}
                mode="filter"
                onClose={() => setShowFilter(false)}
              />
            </div>
          )}
        </div>

        {/* Sort button */}
        <div style={{ position: 'relative' }}>
          <button
            className={`db-toolbar-btn ${sorts.length > 0 ? 'active-filter' : ''}`}
            onClick={() => { setShowSort((v) => !v); setShowFilter(false); setShowHide(false); }}
          >
            <SortAsc size={13} />
            Sort
            {sorts.length > 0 && (
              <span className="filter-badge">{sorts.length}</span>
            )}
          </button>
          {showSort && activeView && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 45 }}>
              <FilterSortPanel
                database={database}
                viewId={activeView.id}
                mode="sort"
                onClose={() => setShowSort(false)}
              />
            </div>
          )}
        </div>

        {/* Properties (hide/show) */}
        <div style={{ position: 'relative' }}>
          <button
            className="db-toolbar-btn"
            onClick={() => { setShowHide((v) => !v); setShowFilter(false); setShowSort(false); }}
          >
            <EyeOff size={13} />
            Properties
          </button>
          {showHide && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={() => setShowHide(false)} />
              <div className="filter-panel" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 45 }}>
                <div className="filter-panel-title">Properties</div>
                {database.properties.map((prop) => (
                  <label key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={!prop.hidden}
                      onChange={() => togglePropertyVisibility(prop.id)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    {prop.name}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Row count indicator when filtered */}
        {filters.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {processedRows.length} of {database.rows.length} rows
          </span>
        )}

        <button
          className="db-toolbar-btn"
          onClick={() => addDatabaseRow(database.id)}
          style={{ color: 'var(--text-primary)' }}
        >
          <Plus size={13} />
          New
        </button>
      </div>

      {/* Filter chips (when filters active) */}
      {filters.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '4px 12px 8px', flexWrap: 'wrap' }}>
          {filters.map((f, i) => {
            const prop = database.properties.find((p) => p.id === f.propertyId);
            return (
              <div key={i} className="filter-chip">
                <span style={{ fontWeight: 500 }}>{prop?.name}</span>
                <span style={{ color: 'var(--text-faint)' }}>{f.condition.replace(/_/g, ' ')}</span>
                {f.value !== null && <span>"{String(f.value)}"</span>}
                <button
                  onClick={() => {
                    const updateDatabaseViewFilters = useStore.getState().updateDatabaseViewFilters;
                    updateDatabaseViewFilters(database.id, activeView!.id, filters.filter((_, idx) => idx !== i));
                  }}
                  style={{ color: 'var(--text-faint)', marginLeft: 2 }}
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
          <button
            style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 8px', borderRadius: 4 }}
            onClick={() => {
              const updateDatabaseViewFilters = useStore.getState().updateDatabaseViewFilters;
              updateDatabaseViewFilters(database.id, activeView!.id, []);
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
