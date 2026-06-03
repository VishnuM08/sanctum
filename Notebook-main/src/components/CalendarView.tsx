import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format,
  addMonths, subMonths,
} from 'date-fns';
import { useStore } from '../store';
import { SELECT_COLORS } from '../types';
import type { Database, DatabaseRow } from '../types';
import { RowDetailModal } from './RowDetailModal';

interface Props {
  database: Database;
  rows: DatabaseRow[];
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ database, rows }: Props) {
  const addDatabaseRow = useStore((s) => s.addDatabaseRow);
  const [current, setCurrent] = useState(new Date());
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const dateProp = database.properties.find((p) => p.type === 'date');

  if (!dateProp) {
    return (
      <div className="calendar-view">
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>No date property</div>
        <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
          Add a Date property to your database to use Calendar view.
        </div>
      </div>
    );
  }

  // Build the 6-week grid
  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 });
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Group rows by day
  const byDay = new Map<string, DatabaseRow[]>();
  rows.forEach((row) => {
    const d = row.values[dateProp.id] as string | null;
    if (!d) return;
    try {
      const key = format(new Date(d), 'yyyy-MM-dd');
      const arr = byDay.get(key) ?? [];
      arr.push(row);
      byDay.set(key, arr);
    } catch { /* ignore bad dates */ }
  });

  const statusProp = database.properties.find((p) => p.type === 'select');

  return (
    <div className="calendar-real">
      {/* Navigation */}
      <div className="calendar-nav">
        <button className="calendar-nav-btn" onClick={() => setCurrent(subMonths(current, 1))}>
          <ChevronLeft size={16} />
        </button>
        <div className="calendar-nav-title">{format(current, 'MMMM yyyy')}</div>
        <button className="calendar-nav-btn" onClick={() => setCurrent(addMonths(current, 1))}>
          <ChevronRight size={16} />
        </button>
        <button
          className="calendar-nav-btn"
          onClick={() => setCurrent(new Date())}
          style={{ marginLeft: 8, fontSize: 12, padding: '3px 10px' }}
        >
          Today
        </button>
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {/* Day headers */}
        {WEEK_DAYS.map((d) => (
          <div key={d} className="calendar-col-header">{d}</div>
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const key      = format(day, 'yyyy-MM-dd');
          const dayRows  = byDay.get(key) ?? [];
          const inMonth  = isSameMonth(day, current);
          const todayDay = isToday(day);

          return (
            <div
              key={key}
              className={`calendar-day-cell ${!inMonth ? 'outside-month' : ''} ${todayDay ? 'today' : ''}`}
            >
              <div className="calendar-day-num-row">
                <span className={`calendar-day-num ${todayDay ? 'today-num' : ''}`}>
                  {format(day, 'd')}
                </span>
                <button
                  className="calendar-add-btn"
                  onClick={() => addDatabaseRow(database.id, { [dateProp.id]: key })}
                  title={`Add on ${format(day, 'MMM d')}`}
                >
                  <Plus size={12} />
                </button>
              </div>

              {dayRows.slice(0, 3).map((row) => {
                const title = (row.values.title as string) || 'Untitled';
                const statusVal = statusProp ? (row.values[statusProp.id] as string) : null;
                const statusOpt = statusVal ? statusProp?.options?.find((o) => o.name === statusVal) : null;
                const colors = statusOpt ? SELECT_COLORS[statusOpt.color] : null;

                return (
                  <button
                    key={row.id}
                    className="calendar-event"
                    style={{
                      background: colors?.bg ?? 'var(--bg-selected)',
                      color: colors?.text ?? 'var(--accent)',
                    }}
                    onClick={() => setSelectedRow(row.id)}
                  >
                    {title}
                  </button>
                );
              })}

              {dayRows.length > 3 && (
                <div style={{ fontSize: 11, color: 'var(--text-faint)', padding: '1px 4px' }}>
                  +{dayRows.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedRow && (
        <RowDetailModal
          database={database}
          rowId={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
