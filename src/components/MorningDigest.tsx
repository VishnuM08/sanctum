import { useMemo, useState, memo } from 'react';
import { Search, Plus, BookOpen, Database, CheckSquare, Clock, Sparkles, Send, Calendar, Lightbulb } from 'lucide-react';
import { useStore } from '../store';
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { NotionIcon } from './NotionIcon';
import { motion } from 'motion/react';
import { useToast } from './Toast';

function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingEmoji(): string {
  const hr = new Date().getHours();
  if (hr < 12) return '🌅';
  if (hr < 17) return '☀️';
  return '🌙';
}

function writingPrompt(): string {
  const prompts = [
    'What is one thing you want to accomplish today?',
    'What key problem are you solving right now?',
    'Capture an idea before it slips away…',
    'What did you learn or discover yesterday?',
    'What important decision is on your mind this week?',
  ];
  return prompts[new Date().getDay() % prompts.length];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 260, damping: 24 } 
  }
};

// A performance-isolated Quick Capture draft component to completely eliminate typing lag
const QuickCaptureWidget = memo(function QuickCaptureWidget({ itemVariants }: { itemVariants: any }) {
  const createPage = useStore((s) => s.createPage);
  const updatePage = useStore((s) => s.updatePage);
  const navigateToPage = useStore((s) => s.navigateToPage);
  const { toast } = useToast();
  const [quickDraft, setQuickThought] = useState('');

  const handleQuickDraftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraft.trim()) return;

    const pageId = createPage(null);
    updatePage(pageId, {
      title: 'Quick Draft - ' + format(new Date(), 'MMM d'),
      icon: '⚡',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: quickDraft.trim() }]
          }
        ]
      }
    });

    setQuickThought('');
    toast('Draft saved to personal workspace! ⚡');
    navigateToPage(pageId);
  };

  const placeholderPrompt = useMemo(() => writingPrompt(), []);

  return (
    <motion.div 
      className="digest-card premium-draft" 
      variants={itemVariants}
      whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
    >
      <div className="digest-card-title">
        <Sparkles size={14} className="accent-color icon-pulse" />
        <span>⚡ Quick Capture</span>
      </div>
      <p className="digest-card-sub">Draft thoughts immediately into your workspace files</p>
      <form onSubmit={handleQuickDraftSubmit} className="digest-draft-form">
        <textarea
          className="digest-draft-input"
          placeholder={placeholderPrompt}
          value={quickDraft}
          onChange={(e) => setQuickThought(e.target.value)}
          rows={3}
        />
        <motion.button 
          type="submit" 
          className="digest-draft-submit-btn"
          disabled={!quickDraft.trim()}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Send size={11} />
          <span>Save Draft</span>
        </motion.button>
      </form>
    </motion.div>
  );
});

export function MorningDigest() {
  const user              = useStore((s) => s.user);
  const pages             = useStore((s) => s.pages);
  const databases         = useStore((s) => s.databases);
  const navigateToPage    = useStore((s) => s.navigateToPage);
  const createPage        = useStore((s) => s.createPage);
  const updateDatabaseRow = useStore((s) => s.updateDatabaseRow);
  const setSearchOpen     = useStore((s) => s.setSearchOpen);
  const { toast }          = useToast();

  const activePages = useMemo(() => pages.filter((p) => !p.isDeleted), [pages]);

  // Recent pages (last 5 edited)
  const recentPages = useMemo(() =>
    [...activePages].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [activePages],
  );

  // Tasks due today / tomorrow from any database with a date property
  const dueSoon = useMemo(() => {
    const items: { 
      title: string; 
      dbName: string; 
      date: Date; 
      done: boolean;
      dbId: string;
      rowId: string;
      statusPropId: string;
    }[] = [];
    
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
              dbId: db.id,
              rowId: row.id,
              statusPropId: statusProp?.id || '',
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

  const handleToggleTask = (task: typeof dueSoon[0]) => {
    if (!task.statusPropId) return;
    updateDatabaseRow(task.dbId, task.rowId, {
      [task.statusPropId]: task.done ? 'Todo' : 'Done',
    });
    toast(task.done ? 'Task marked as Todo' : 'Task completed! 🎉');
  };

  const greetingWord = getGreeting();
  const greetingEmoji = getGreetingEmoji();

  return (
    <motion.div 
      className="morning-digest"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Premium Hero Welcoming Panel */}
      <motion.div 
        className="digest-hero" 
        variants={itemVariants}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
      >
        <div className="digest-hero-main">
          <div className="digest-greeting">
            <span className="greeting-emoji-spin">{greetingEmoji}</span> {greetingWord}, {user.name}
            {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
              <img src={user.avatar} alt="avatar" className="digest-avatar img-bounce" />
            ) : (
              user.avatar && <span className="digest-avatar-emoji"><NotionIcon icon={user.avatar} size="28px" /></span>
            )}
          </div>
          <div className="digest-date">
            <Calendar size={13} className="digest-calendar-glow" style={{ marginRight: 6, color: 'var(--accent)' }} />
            <span>{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>
        </div>
        <div className="digest-quote">
          <Sparkles size={14} className="digest-quote-icon icon-glow-pulse" />
          <span>"Your mind is for having ideas, not holding them." — David Allen</span>
        </div>
      </motion.div>

      {/* Modern Bento Stats Row */}
      <motion.div className="digest-stats-bento" variants={itemVariants}>
        <motion.div 
          className="digest-stat-card"
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <div className="digest-stat-icon-wrap icon-docs"><BookOpen size={16} /></div>
          <div className="digest-stat-info">
            <span className="digest-stat-val">{totalPages}</span>
            <span className="digest-stat-lbl">documents</span>
          </div>
        </motion.div>
        
        <motion.div 
          className="digest-stat-card"
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <div className="digest-stat-icon-wrap icon-db"><Database size={16} /></div>
          <div className="digest-stat-info">
            <span className="digest-stat-val">{totalDbs}</span>
            <span className="digest-stat-lbl">databases</span>
          </div>
        </motion.div>

        <motion.div 
          className="digest-stat-card"
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <div className="digest-stat-icon-wrap icon-tasks"><CheckSquare size={16} /></div>
          <div className="digest-stat-info">
            <span className="digest-stat-val">{todayTasks.length}</span>
            <span className="digest-stat-lbl">due today</span>
          </div>
        </motion.div>

        <motion.div 
          className="digest-stat-card"
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <div className="digest-stat-icon-wrap icon-edits"><Clock size={16} /></div>
          <div className="digest-stat-info">
            <span className="digest-stat-val">{editedToday}</span>
            <span className="digest-stat-lbl">edits today</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Primary Landing Quick Dock */}
      <motion.div className="digest-quick-dock" variants={itemVariants}>
        <motion.button 
          className="digest-dock-btn active" 
          onClick={() => createPage()}
          whileHover={{ scale: 1.025, y: -1 }}
          whileTap={{ scale: 0.975 }}
        >
          <Plus size={15} /> <span>Create Page</span>
        </motion.button>
        <motion.button 
          className="digest-dock-btn" 
          onClick={() => setSearchOpen(true)}
          whileHover={{ scale: 1.025, y: -1 }}
          whileTap={{ scale: 0.975 }}
        >
          <Search size={15} /> <span>Search Workspace</span>
        </motion.button>
      </motion.div>

      {/* Bento Grid Panel */}
      <div className="digest-bento-grid">
        
        {/* Left Column: Quick Draft & Recent Files */}
        <div className="digest-bento-column">
          
          {/* Performance-isolated Quick Capture Widget */}
          <QuickCaptureWidget itemVariants={itemVariants} />

          {/* Recently Edited Card */}
          <motion.div 
            className="digest-card" 
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
          >
            <div className="digest-card-title">
              <Clock size={14} className="accent-color" />
              <span>Recently Edited</span>
            </div>
            {recentPages.length === 0 ? (
              <div className="digest-empty">No pages inside your workspace yet.</div>
            ) : (
              <div className="digest-page-list">
                {recentPages.map((p) => (
                  <motion.button
                    key={p.id}
                    className="digest-page-row"
                    onClick={() => navigateToPage(p.id)}
                    whileHover={{ x: 4, background: 'var(--bg-hover-strong)' }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <span className="digest-page-icon"><NotionIcon icon={p.icon || 'notion_page'} size="1.2em" /></span>
                    <span className="digest-page-title">{p.title || 'Untitled'}</span>
                    <span className="digest-page-time">
                      {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Column: Upcoming Agenda & Motivation */}
        <div className="digest-bento-column">
          
          {/* Active Agenda Panel */}
          <motion.div 
            className="digest-card" 
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
          >
            <div className="digest-card-title">
              <CheckSquare size={14} className="accent-color" />
              <span>Upcoming Agenda</span>
            </div>
            {dueSoon.length === 0 ? (
              <div className="digest-empty">No tasks scheduled for today or tomorrow 🎉</div>
            ) : (
              <div className="digest-agenda-list">
                {todayTasks.length > 0 && (
                  <>
                    <div className="digest-section-label">Today</div>
                    {todayTasks.map((t, i) => (
                      <DueTaskRow key={i} task={t} onToggle={() => handleToggleTask(t)} />
                    ))}
                  </>
                )}
                {tomorrowTasks.length > 0 && (
                  <>
                    <div className="digest-section-label">Tomorrow</div>
                    {tomorrowTasks.map((t, i) => (
                      <DueTaskRow key={i} task={t} onToggle={() => handleToggleTask(t)} />
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Reflections / Quick Tip Card */}
          <motion.div 
            className="digest-card tip-card" 
            variants={itemVariants}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
          >
            <div className="digest-card-title">
              <Lightbulb size={14} style={{ color: 'var(--yellow)' }} className="tip-glow-icon" />
              <span>Productivity Tip</span>
            </div>
            <div className="digest-tip-body">
              Focus on **one high-priority task** at a time. Multi-tasking decreases focus depth by up to **40%**. Block out a 25-minute deep-work sprint for your main objective today.
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}

const DueTaskRow = memo(function DueTaskRow({ task, onToggle }: { task: any; onToggle: () => void }) {
  return (
    <motion.div 
      className={`digest-task ${task.done ? 'done' : ''}`} 
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      whileHover={{ x: 4, background: 'var(--bg-hover-strong)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <motion.button 
        type="button" 
        className={`digest-task-checkbox ${task.done ? 'checked' : ''}`}
        aria-label="Toggle task completion"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        whileTap={{ scale: 0.8 }}
      >
        {task.done && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </motion.button>
      <span className="digest-task-title">{task.title}</span>
      <span className="digest-task-db">{task.dbName}</span>
    </motion.div>
  );
});
