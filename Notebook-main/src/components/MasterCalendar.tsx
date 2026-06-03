import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
  format, addMonths, subMonths,
} from 'date-fns';
import { useStore } from '../store';
import { SELECT_COLORS } from '../types';
import { RowDetailModal } from './RowDetailModal';

// Assign a distinct hue to each database
const DB_COLORS = [
  '#2383e2', '#e03e3e', '#0f7b6c', '#dfab01',
  '#6940a5', '#ad1a72', '#d9730d', '#9b9a97',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MasterCalendar() {
  const databases    = useStore((s) => s.databases);
  const addRow       = useStore((s) => s.addDatabaseRow);
  const navigate     = useStore((s) => s.navigate);

  const [current,     setCurrent]     = useState(new Date());
  const [hiddenDbs,   setHiddenDbs]   = useState<Set<string>>(new Set());
  const [detailInfo,  setDetailInfo]  = useState<{ dbId: string; rowId: string } | null>(null);

  // Find all databases that have at least one date property
  const calDbs = useMemo(() =>
    databases
      .map((db, i) => ({
        db,
        dateProp: db.properties.find((p) => p.type === 'date'),
        statusProp: db.properties.find((p) => p.type === 'select'),
        color: DB_COLORS[i % DB_COLORS.length],
      }))
      .filter((x) => x.dateProp),
    [databases],
  );

  // Build calendar grid
  const gridStart = startOfWeek(startOfMonth(current), { weekStartsOn: 0 });
  const gridEnd   = endOfWeek(endOfMonth(current),    { weekStartsOn: 0 });
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Collect all events grouped by date key
  type CalEvent = { dbId: string; rowId: string; title: string; color: string; statusColor?: string };
  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const { db, dateProp, statusProp, color } of calDbs) {
      if (!dateProp || hiddenDbs.has(db.id)) continue;
      for (const row of db.rows) {
        const d = row.values[dateProp.id] as string | null;
        if (!d) continue;
        try {
          const key = format(new Date(d), 'yyyy-MM-dd');
          const arr = map.get(key) ?? [];
          // Status-based color
          const statusVal = statusProp ? (row.values[statusProp.id] as string) : null;
          const statusOpt = statusVal ? statusProp?.options?.find((o) => o.name === statusVal) : null;
          const statusColor = statusOpt ? SELECT_COLORS[statusOpt.color].bg : undefined;
          arr.push({ dbId: db.id, rowId: row.id, title: (row.values.title as string) || 'Untitled', color, statusColor });
          map.set(key, arr);
        } catch { /* ignore */ }
      }
    }
    return map;
  }, [calDbs, hiddenDbs]);

  const toggleDb = (id: string) =>
    setHiddenDbs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const detailDb  = detailInfo ? databases.find((db) => db.id === detailInfo.dbId) : null;

  return (
    <div className="master-cal-page">
      {/* Page header */}
      <div className="master-cal-header">
        <button className="topbar-btn" onClick={() => navigate({ type: 'home' })}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="master-cal-title">📅 Calendar</h1>
          <p className="master-cal-sub">All events across {calDbs.length} databases</p>
        </div>
      </div>

      <div className="master-cal-layout">
        {/* Left panel — database legend */}
        <div className="master-cal-sidebar">
          <div className="master-cal-legend-label">Databases</div>
          {calDbs.map(({ db, color }) => (
            <button
              key={db.id}
              className={`master-cal-db-row ${hiddenDbs.has(db.id) ? 'hidden' : ''}`}
              onClick={() => toggleDb(db.id)}
            >
              <span
                className="master-cal-db-dot"
                style={{ background: hiddenDbs.has(db.id) ? 'var(--border-strong)' : color }}
              />
              <span className="master-cal-db-name">{db.icon} {db.title}</span>
            </button>
          ))}

          {calDbs.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '8px 4px' }}>
              No databases with date properties found.
            </div>
          )}

          {/* Mini month navigator */}
          <div className="master-cal-mini-nav">
            <button className="calendar-nav-btn" onClick={() => setCurrent(subMonths(current, 1))}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{format(current, 'MMM yyyy')}</span>
            <button className="calendar-nav-btn" onClick={() => setCurrent(addMonths(current, 1))}>
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            className="master-cal-today-btn"
            onClick={() => setCurrent(new Date())}
          >
            Today
          </button>
        </div>

        {/* Main calendar grid */}
        <div className="master-cal-main">
          {/* Navigation header */}
          <div className="master-cal-nav">
            <button className="calendar-nav-btn" onClick={() => setCurrent(subMonths(current, 1))}>
              <ChevronLeft size={16} />
            </button>
            <h2 className="master-cal-month">{format(current, 'MMMM yyyy')}</h2>
            <button className="calendar-nav-btn" onClick={() => setCurrent(addMonths(current, 1))}>
              <ChevronRight size={16} />
            </button>
            <button
              className="calendar-nav-btn"
              style={{ marginLeft: 8, fontSize: 12, padding: '3px 12px', borderRadius: 4 }}
              onClick={() => setCurrent(new Date())}
            >
              Today
            </button>
          </div>

          {/* Grid */}
          <div className="master-cal-grid">
            {/* Day headers */}
            {WEEK_DAYS.map((d) => (
              <div key={d} className="master-cal-col-header">{d}</div>
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const key     = format(day, 'yyyy-MM-dd');
              const events  = byDay.get(key) ?? [];
              const inMonth = isSameMonth(day, current);
              const today   = isToday(day);

              return (
                <div
                  key={key}
                  className={`master-cal-day ${!inMonth ? 'outside' : ''} ${today ? 'today' : ''}`}
                >
                  <div className="master-cal-day-top">
                    <span className={`master-cal-day-num ${today ? 'today-num' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {/* Add event button on hover */}
                    {calDbs.length > 0 && (
                      <button
                        className="master-cal-add-btn"
                        onClick={() => {
                          const first = calDbs.find((c) => !hiddenDbs.has(c.db.id));
                          if (first?.dateProp) {
                            addRow(first.db.id, { [first.dateProp.id]: key });
                          }
                        }}
                        title={`Add event on ${format(day, 'MMM d')}`}
                      >
                        <Plus size={11} />
                      </button>
                    )}
                  </div>

                  {/* Events */}
                  {events.slice(0, 3).map((ev, i) => (
                    <button
                      key={`${ev.rowId}-${i}`}
                      className="master-cal-event"
                      style={{
                        background: ev.statusColor ?? `${ev.color}25`,
                        color: ev.color,
                        borderLeft: `3px solid ${ev.color}`,
                      }}
                      onClick={() => setDetailInfo({ dbId: ev.dbId, rowId: ev.rowId })}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {events.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', padding: '1px 4px' }}>
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row detail modal */}
      {detailInfo && detailDb && (
        <RowDetailModal
          database={detailDb}
          rowId={detailInfo.rowId}
          onClose={() => setDetailInfo(null)}
        />
      )}
    </div>
  );
}
