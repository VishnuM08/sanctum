import { useMemo } from 'react';
import { Search, Plus, BookOpen, Database, CheckSquare, Clock } from 'lucide-react';
import { useStore } from '../store';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { NotionIcon } from './NotionIcon';

function greeting(): string {
  return 'Hi';
}

function writingPrompt(): string {
  const prompts = [
    'What\'s one thing you want to accomplish today?',
    'What problem are you solving right now?',
    'Capture a thought before it slips away…',
    'What did you learn yesterday?',
    'What decision do you need to make this week?',
  ];
  return prompts[new Date().getDay() % prompts.length];
}

export function MorningDigest() {
  const user        = useStore((s) => s.user);
  const pages       = useStore((s) => s.pages);
  const databases   = useStore((s) => s.databases);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const createPage  = useStore((s) => s.createPage);
  const setSearchOpen = useStore((s) => s.setSearchOpen);

  const activePages = useMemo(() => pages.filter((p) => !p.isDeleted), [pages]);

  // Recent pages (last 5 edited)
  const recentPages = useMemo(() =>
    [...activePages].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [activePages],
  );

  // Tasks due today / tomorrow from any database with a date property
  const dueSoon = useMemo(() => {
    const items: { title: string; dbName: string; date: Date; done: boolean }[] = [];
    for (const db of databases) {
      const dateProp = db.properties.find((p) => p.type === 'date');
      const statusProp = db.properties.find((p) => p.type === 'select');
      if (!dateProp) continue;
      for (const row of db.rows) {
        const d = row.values[dateProp.id] as string | null;
        if (!d) continue;
        try {
          const date = new Date(d);
          if (isToday(date) || isTomorrow(date)) {
            const statusVal = statusProp ? (row.values[statusProp.id] as string) : null;
            const done = statusVal?.toLowerCase().includes('done') ?? false;
            items.push({
              title: (row.values.title as string) || 'Untitled',
              dbName: db.title,
              date,
              done,
            });
          }
        } catch { /* ignore */ }
      }
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [databases]);

  const todayTasks  = dueSoon.filter((t) => isToday(t.date));
  const tomorrowTasks = dueSoon.filter((t) => isTomorrow(t.date));

  const totalPages = activePages.length;
  const totalDbs   = databases.length;
  const editedToday = activePages.filter((p) => isToday(new Date(p.updatedAt))).length;

  return (
    <div className="morning-digest">
      {/* Hero */}
      <div className="digest-hero">
        <div className="digest-greeting">
          {greeting()}, {user.name}{' '}
          {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
            <img src={user.avatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', verticalAlign: 'middle', marginLeft: 6, objectFit: 'cover' }} />
          ) : (
            user.avatar && <NotionIcon icon={user.avatar} size="24px" style={{ marginLeft: 6 }} />
          )}
        </div>
        <div className="digest-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
      </div>

      {/* Stats row */}
      <div className="digest-stats">
        <div className="digest-stat">
          <BookOpen size={16} />
          <span className="digest-stat-num">{totalPages}</span>
          <span className="digest-stat-label">pages</span>
        </div>
        <div className="digest-stat">
          <Database size={16} />
          <span className="digest-stat-num">{totalDbs}</span>
          <span className="digest-stat-label">databases</span>
        </div>
        <div className="digest-stat">
          <CheckSquare size={16} />
          <span className="digest-stat-num">{todayTasks.length}</span>
          <span className="digest-stat-label">due today</span>
        </div>
        <div className="digest-stat">
          <Clock size={16} />
          <span className="digest-stat-num">{editedToday}</span>
          <span className="digest-stat-label">edited today</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="digest-quick-actions">
        <button className="digest-action-btn primary" onClick={() => createPage()}>
          <Plus size={15} /> New page
        </button>
        <button className="digest-action-btn" onClick={() => setSearchOpen(true)}>
          <Search size={15} /> Search  <span className="digest-kbd">⌘K</span>
        </button>
      </div>

      <div className="digest-grid">
        {/* Tasks due soon */}
        {dueSoon.length > 0 && (
          <div className="digest-card">
            <div className="digest-card-title">
              <CheckSquare size={14} /> Tasks due soon
            </div>
            {todayTasks.length > 0 && (
              <>
                <div className="digest-section-label">Today</div>
                {todayTasks.map((t, i) => (
                  <DueTask key={i} task={t} />
                ))}
              </>
            )}
            {tomorrowTasks.length > 0 && (
              <>
                <div className="digest-section-label">Tomorrow</div>
                {tomorrowTasks.map((t, i) => (
                  <DueTask key={i} task={t} />
                ))}
              </>
            )}
            {dueSoon.length === 0 && (
              <div className="digest-empty">No tasks due soon 🎉</div>
            )}
          </div>
        )}

        {/* Recent pages */}
        <div className="digest-card">
          <div className="digest-card-title">
            <Clock size={14} /> Recently edited
          </div>
          {recentPages.length === 0 && (
            <div className="digest-empty">No pages yet</div>
          )}
          {recentPages.map((p) => (
            <button
              key={p.id}
              className="digest-page-row"
              onClick={() => navigateToPage(p.id)}
            >
              <span className="digest-page-icon"><NotionIcon icon={p.icon || 'notion_page'} size="1.2em" /></span>
              <span className="digest-page-title">{p.title || 'Untitled'}</span>
              <span className="digest-page-time">
                {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
              </span>
            </button>
          ))}
        </div>

        {/* Writing prompt */}
        <div className="digest-card digest-prompt-card">
          <div className="digest-card-title">
            <NotionIcon icon="notion_page" size="14px" style={{ marginRight: 6 }} /> Start writing
          </div>
          <div className="digest-prompt-text">{writingPrompt()}</div>
          <button
            className="digest-action-btn primary"
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
            onClick={() => createPage()}
          >
            <Plus size={14} /> New page
          </button>
        </div>
      </div>
    </div>
  );
}

function DueTask({ task }: { task: { title: string; dbName: string; date: Date; done: boolean } }) {
  return (
    <div className={`digest-task ${task.done ? 'done' : ''}`}>
      <span className="digest-task-check">{task.done ? '✅' : '⬜'}</span>
      <span className="digest-task-title">{task.title}</span>
      <span className="digest-task-db">{task.dbName}</span>
    </div>
  );
}
