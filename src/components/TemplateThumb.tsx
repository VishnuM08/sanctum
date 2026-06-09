/**
 * Template thumbnails that look like real Notion page screenshots,
 * redesigned to look premium, modern, and perfectly theme-adaptive (light/dark mode).
 */

const S = {
  title:  'var(--text-primary)',
  muted:  'var(--text-muted)',
  faint:  'var(--text-faint)',
  line:   'var(--border)',
  blue:   'var(--accent)',
  green:  '#10b981',
  red:    '#ef4444',
  yellow: '#f59e0b',
  orange: '#f97316',
  purple: '#a29bfe',
  bg:     'var(--bg-app)',
};

/* ── Primitives ─────────────────────────────────────────────────────────── */

const TL = ({ x, y, w, h = 3.5, c = S.faint, r = 1.75 }: { x: number; y: number; w: number; h?: number; c?: string; r?: number }) =>
  <rect x={x} y={y} width={w} height={h} rx={r} fill={c} opacity={0.4} />;

const TH = ({ x, y, w, c = S.title }: { x: number; y: number; w: number; c?: string }) =>
  <rect x={x} y={y} width={w} height={6} rx={3} fill={c} opacity={0.85} />;

const Dot = ({ x, y, c = S.muted }: { x: number; y: number; c?: string }) =>
  <circle cx={x} cy={y + 2.5} r={2.5} fill={c} opacity={0.5} />;

const Bl = ({ x, y, w, c = S.muted }: { x: number; y: number; w: number; c?: string }) =>
  <><Dot x={x} y={y} c={c} /><TL x={x + 10} y={y + 0.75} w={w} /></>;

const Num = ({ x, y, w, n, c = S.muted }: { x: number; y: number; w: number; n: number; c?: string }) =>
  <g>
    <circle cx={x + 4} cy={y + 3} r={4.5} fill={c} opacity={0.12} />
    <text x={x + 4} y={y + 6.2} textAnchor="middle" fontSize={5} fill={c} fontWeight={700} fontFamily="var(--font-sans)">{n}</text>
    <TL x={x + 14} y={y + 1.25} w={w} />
  </g>;

const CBox = ({ x, y, checked = false, c = S.blue }: { x: number; y: number; checked?: boolean; c?: string }) =>
  <g>
    <rect x={x} y={y} width={8} height={8} rx={2} fill={checked ? c : 'none'} stroke={checked ? c : 'var(--text-faint)'} strokeWidth={checked ? 0 : 1} opacity={checked ? 0.9 : 0.4} />
    {checked && <path d={`M ${x+2.2} ${y+4} L ${x+3.7} ${y+5.8} L ${x+6.2} ${y+2.2}`} stroke="var(--bg-app)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
  </g>;

const CR = ({ x, y, w, done = false }: { x: number; y: number; w: number; done?: boolean }) =>
  <><CBox x={x} y={y} checked={done} /><TL x={x + 12} y={y + 2.25} w={w} c={done ? S.muted : S.title} /></>;

const Badge = ({ x, y, w, bg, label }: { x: number; y: number; w: number; bg: string; label: string }) =>
  <g>
    <rect x={x} y={y} width={w} height={9} rx={4.5} fill={bg} opacity={0.12} />
    <text x={x + w / 2} y={y + 6.5} textAnchor="middle" fontSize={4.5} fill={bg} fontWeight={600} fontFamily="var(--font-sans)">{label}</text>
  </g>;

const HR = ({ x, y, w }: { x: number; y: number; w: number }) =>
  <line x1={x} y1={y} x2={x + w} y2={y} stroke="var(--border)" strokeWidth={0.8} />;

/* ── Page Screenshot wrapper ─────────────────────────────────────────────── */

interface PageThumb {
  cover: string;    // gradient or solid color CSS value
  emoji: string;
  title: string;
  children: React.ReactNode;
}

function PageScreenshot({ cover, emoji, title, children }: PageThumb) {
  const cleanTitle = title.replace(/\s/g, '');
  return (
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* Background card with theme-adaptive fill */}
      <rect width="280" height="160" fill="var(--bg-app)" />

      {/* Cover — parsed inline from CSS value; we just use a rect with gradient */}
      <defs>
        <linearGradient id={`cov-${cleanTitle}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={getCoverStop(cover, 0)} />
          <stop offset="100%" stopColor={getCoverStop(cover, 1)} />
        </linearGradient>
      </defs>
      <rect width="280" height="48" fill={`url(#cov-${cleanTitle})`} opacity={0.9} />
      
      {/* Dynamic theme-adaptive subtle bottom border on cover to look sleek */}
      <rect y={47.5} width="280" height="0.5" fill="var(--border)" />

      {/* Emoji Shadow & Glow */}
      <g filter="drop-shadow(0 4px 6px rgba(0,0,0,0.12))">
        <text x="24" y="65" fontSize={24} dominantBaseline="middle">{emoji}</text>
      </g>

      {/* Title with modern font and subtle kerning */}
      <text x="24" y="96" fontSize={12.5} fontWeight="700" fill="var(--text-primary)" fontFamily="var(--font-sans)"
            style={{ letterSpacing: '-0.2px' }}>
        {title.length > 26 ? title.slice(0, 24) + '…' : title}
      </text>

      {/* Content */}
      <g transform="translate(0, 0)">{children}</g>
    </svg>
  );
}

// Extract the two gradient stop colors from a CSS linear-gradient string
function getCoverStop(css: string, idx: number): string {
  const colors = css.match(/#[0-9a-fA-F]{6}/g) ?? [];
  if (colors.length >= 2) return colors[idx];
  if (colors.length === 1) return colors[0];
  // Solid color
  const solid = css.match(/#[0-9a-fA-F]{3,6}/);
  return solid ? solid[0] : '#667eea';
}

/* ── Individual thumbnail components ─────────────────────────────────────── */

export const MeetingNotesThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#667eea,#764ba2)" emoji="📋" title="Meeting Notes">
    <TL x={24} y={105} w={110} h={3.5} c={S.muted} />
    <HR x={24} y={114} w={232} />
    <TH x={24} y={120} w={60} c={S.title} />
    <Num x={24} y={130} w={130} n={1} c={S.blue} />
    <Num x={24} y={139} w={110} n={2} c={S.blue} />
    <HR x={24} y={149} w={232} />
    <CR x={176} y={106} w={74} done />
    <CR x={176} y={118} w={58} />
    <CR x={176} y={130} w={66} />
  </PageScreenshot>
);

export const ProjectBriefThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#4facfe,#00f2fe)" emoji="🚀" title="Project Brief">
    {/* Callout */}
    <g>
      <rect x={24} y={104} width={232} height={15} rx={3} fill="rgba(245, 158, 11, 0.08)" stroke="rgba(245, 158, 11, 0.15)" strokeWidth={0.5} />
      <rect x={24} y={104} width={3} height={15} rx={1} fill={S.yellow} />
      <TL x={33} y={109} w={150} h={3.5} c={S.yellow} />
    </g>
    <TH x={24} y={125} w={50} />
    <Bl x={24} y={134} w={140} />
    <Bl x={24} y={143} w={120} />
    {/* Timeline bar */}
    <g>
      <rect x={136} y={104} width={120} height={8} rx={4} fill="var(--border)" />
      <rect x={136} y={104} width={65} height={8} rx={4} fill={S.blue} opacity={0.6} />
      <TL x={136} y={116} w={36} h={2} c={S.muted} />
      <TL x={178} y={116} w={36} h={2} c={S.muted} />
    </g>
  </PageScreenshot>
);

export const WeeklyReviewThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#43e97b,#38f9d7)" emoji="🗓️" title="Weekly Review">
    <TH x={24} y={105} w={44} c={S.green} />
    <TH x={148} y={105} w={44} c={S.red} />
    <Bl x={24} y={115} w={100} c={S.green} />
    <Bl x={24} y={124} w={90} c={S.green} />
    <Bl x={148} y={115} w={90} c={S.red} />
    <Bl x={148} y={124} w={80} c={S.red} />
    <HR x={24} y={135} w={232} />
    <TH x={24} y={141} w={80} />
    <CR x={24} y={149} w={96} done />
    <CR x={140} y={149} w={86} />
  </PageScreenshot>
);

export const OneonOneThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#fa709a,#fee140)" emoji="🤝" title="1:1 Meeting">
    <TH x={24} y={105} w={50} />
    <TL x={24} y={115} w={200} c={S.faint} />
    <TL x={24} y={122} w={160} c={S.faint} />
    <HR x={24} y={131} w={232} />
    <TH x={24} y={137} w={80} c={S.blue} />
    <CR x={24} y={147} w={140} done />
    <CR x={24} y={156} w={120} />
  </PageScreenshot>
);

export const DailyJournalThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#f6d365,#fda085)" emoji="✍️" title="Daily Journal">
    {/* Mood row */}
    {['😄','🙂','😐','😔'].map((e, i) => (
      <g key={i} opacity={i === 0 ? 1 : 0.35}>
        <text x={24 + i * 20} y={114} fontSize={11}>{e}</text>
      </g>
    ))}
    <HR x={24} y={122} w={232} />
    <TH x={24} y={128} w={56} c={S.orange} />
    <TL x={24} y={137} w={200} c={S.faint} />
    <TL x={24} y={145} w={180} c={S.faint} />
    <CR x={24} y={152} w={130} done />
  </PageScreenshot>
);

export const ReadingNotesThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#a18cd1,#fbc2eb)" emoji="📚" title="Reading Notes">
    <TH x={24} y={105} w={90} />
    <TL x={24} y={114} w={200} c={S.faint} />
    {/* Quote block */}
    <g>
      <rect x={24} y={123} width={3} height={23} rx={1.5} fill={S.purple} />
      <TL x={32} y={126} w={180} c={S.muted} />
      <TL x={32} y={134} w={160} c={S.muted} />
      <TL x={32} y={142} w={100} c={S.muted} />
    </g>
    <TH x={24} y={152} w={64} />
  </PageScreenshot>
);

export const TravelPlannerThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#89f7fe,#66a6ff)" emoji="✈️" title="Travel Planner">
    <TL x={24} y={105} w={200} c={S.faint} />
    {/* 3 day cards */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={24 + i * 72} y={111} width={66} height={37} rx={4} fill="var(--bg-app-shaded)" stroke="var(--border)" strokeWidth={0.5} />
        <TL x={30 + i * 72} y={116} w={44} h={4} c={S.blue} />
        <CR x={30 + i * 72} y={124} w={36} done={i < 2} />
        <CR x={30 + i * 72} y={134} w={32} />
      </g>
    ))}
    <TH x={24} y={154} w={52} />
  </PageScreenshot>
);

export const StudyNotesThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#d4fc79,#96e6a1)" emoji="🎓" title="Study Notes">
    <TH x={24} y={105} w={80} c={S.green} />
    <Bl x={24} y={115} w={160} c={S.green} />
    <Bl x={24} y={124} w={140} c={S.green} />
    {/* Concept box */}
    <g>
      <rect x={24} y={133} width={232} height={17} rx={3} fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth={0.5} />
      <rect x={24} y={133} width={3} height={17} rx={1} fill={S.green} />
      <TL x={33} y={138} w={100} h={4} c={S.green} />
      <TL x={140} y={138} w={80} h={4} c={S.faint} />
    </g>
    <TH x={24} y={156} w={64} />
  </PageScreenshot>
);

export const BugReportThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#c4403d,#eb5757)" emoji="🐛" title="Bug Report">
    {/* Severity badges */}
    <Badge x={24} y={105} w={38} bg={S.red} label="Critical" />
    <Badge x={68} y={105} w={30} bg={S.orange} label="High" />
    <Badge x={104} y={105} w={34} bg={S.yellow} label="Medium" />
    <TH x={24} y={119} w={68} />
    <TL x={24} y={128} w={200} c={S.faint} />
    <TL x={24} y={136} w={170} c={S.faint} />
    <HR x={24} y={145} w={232} />
    <Num x={24} y={150} w={110} n={1} c={S.red} />
    <Num x={150} y={150} w={90} n={2} c={S.red} />
  </PageScreenshot>
);

export const OKRsThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#fddb92,#d1fdff)" emoji="🎯" title="OKRs">
    {[
      { label: 'Objective 1', color: S.yellow, bg: 'rgba(245, 158, 11, 0.08)', stroke: 'rgba(245, 158, 11, 0.15)' },
      { label: 'Objective 2', color: S.green,  bg: 'rgba(16, 185, 129, 0.08)', stroke: 'rgba(16, 185, 129, 0.15)' },
      { label: 'Objective 3', color: S.blue,   bg: 'rgba(59, 130, 246, 0.08)',  stroke: 'rgba(59, 130, 246, 0.15)' },
    ].map(({ color, bg, stroke }, i) => (
      <g key={i}>
        <rect x={24} y={105 + i * 18} width={232} height={14} rx={3} fill={bg} stroke={stroke} strokeWidth={0.5} />
        <rect x={24} y={105 + i * 18} width={3} height={14} rx={1} fill={color} />
        <TL x={33} y={110 + i * 18} w={80} h={4} c={color} />
        <CR x={154} y={108 + i * 18} w={45} done={i === 0} />
        <CR x={208} y={108 + i * 18} w={36} done={i < 2} />
      </g>
    ))}
    <HR x={24} y={159} w={232} />
  </PageScreenshot>
);

export const ProductSpecThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#89dceb,#66a6ff)" emoji="📐" title="Product Spec">
    <TH x={24} y={105} w={80} />
    <TL x={24} y={114} w={200} c={S.faint} />
    <TL x={24} y={121} w={170} c={S.faint} />
    <HR x={24} y={129} w={232} />
    <TH x={24} y={135} w={64} c={S.blue} />
    <Bl x={24} y={144} w={140} c={S.blue} />
    <Bl x={24} y={152} w={130} c={S.blue} />
    <CR x={176} y={135} w={60} done />
    <CR x={176} y={146} w={55} done />
    <CR x={176} y={157} w={50} />
  </PageScreenshot>
);

/* ── Lookup map ─────────────────────────────────────────────────────────── */

export const TEMPLATE_THUMBS: Record<string, React.FC> = {
  'meeting-notes':  MeetingNotesThumb,
  'project-brief':  ProjectBriefThumb,
  'weekly-review':  WeeklyReviewThumb,
  'one-on-one':     OneonOneThumb,
  'daily-journal':  DailyJournalThumb,
  'reading-notes':  ReadingNotesThumb,
  'travel-planner': TravelPlannerThumb,
  'study-notes':    StudyNotesThumb,
  'bug-report':     BugReportThumb,
  'okrs':           OKRsThumb,
  'product-spec':   ProductSpecThumb,
};
