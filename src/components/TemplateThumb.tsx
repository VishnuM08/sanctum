/**
 * Template thumbnails that look like real Notion page screenshots.
 * Layout per card:
 *   [full-width cover gradient — 48px]
 *   [emoji icon at 32px, overlapping cover]
 *   [bold page title]
 *   [3–5 content rows showing the template structure]
 */

const S = {
  title:  '#37352f',
  muted:  '#9b9a97',
  faint:  '#c7c6c3',
  line:   '#e9e9e7',
  blue:   '#2383e2',
  green:  '#448361',
  red:    '#c4403d',
  yellow: '#c18d14',
  orange: '#cc772f',
  purple: '#9065b0',
  bg:     '#ffffff',
};

/* ── Primitives ─────────────────────────────────────────────────────────── */

const TL = ({ x, y, w, h = 3, c = S.faint, r = 1.5 }: { x: number; y: number; w: number; h?: number; c?: string; r?: number }) =>
  <rect x={x} y={y} width={w} height={h} rx={r} fill={c} />;

const TH = ({ x, y, w, c = S.title }: { x: number; y: number; w: number; c?: string }) =>
  <TL x={x} y={y} w={w} h={6} c={c} r={2} />;

const Dot = ({ x, y, c = S.muted }: { x: number; y: number; c?: string }) =>
  <circle cx={x} cy={y + 2} r={2.5} fill={c} />;

const Bl = ({ x, y, w, c = S.muted }: { x: number; y: number; w: number; c?: string }) =>
  <><Dot x={x} y={y} c={c} /><TL x={x + 8} y={y} w={w} c={S.faint} /></>;

const Num = ({ x, y, w, n, c = S.muted }: { x: number; y: number; w: number; n: number; c?: string }) =>
  <><circle cx={x + 4} cy={y + 2} r={4} fill={c} opacity={0.15} />
    <text x={x + 4} y={y + 5.5} textAnchor="middle" fontSize={4.5} fill={c} fontWeight={700}>{n}</text>
    <TL x={x + 12} y={y} w={w} c={S.faint} /></>;

const CBox = ({ x, y, checked = false, c = S.blue }: { x: number; y: number; checked?: boolean; c?: string }) =>
  <><rect x={x} y={y - 1} width={8} height={8} rx={1.5} fill={checked ? c : 'none'} stroke={checked ? c : S.muted} strokeWidth={0.8} opacity={0.6} />
    {checked && <text x={x + 4} y={y + 5.5} textAnchor="middle" fontSize={6} fill={S.bg} opacity={0.9}>✓</text>}</>;

const CR = ({ x, y, w, done = false }: { x: number; y: number; w: number; done?: boolean }) =>
  <><CBox x={x} y={y} checked={done} /><TL x={x + 12} y={y + 1} w={w} c={S.faint} /></>;

const Badge = ({ x, y, w, bg, label }: { x: number; y: number; w: number; bg: string; label: string }) =>
  <><rect x={x} y={y} width={w} height={9} rx={4.5} fill={bg} opacity={0.2} />
    <text x={x + w / 2} y={y + 6} textAnchor="middle" fontSize={4} fill={bg} fontWeight={600}>{label}</text></>;

const HR = ({ x, y, w }: { x: number; y: number; w: number }) =>
  <line x1={x} y1={y} x2={x + w} y2={y} stroke={S.line} strokeWidth={0.8} />;

/* ── Page Screenshot wrapper ─────────────────────────────────────────────── */

interface PageThumb {
  cover: string;    // gradient or solid color CSS value
  emoji: string;
  title: string;
  children: React.ReactNode;
}

function PageScreenshot({ cover, emoji, title, children }: PageThumb) {
  return (
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* White page background */}
      <rect width="280" height="160" fill={S.bg} />

      {/* Cover — parsed inline from CSS value; we just use a rect with gradient */}
      <defs>
        <linearGradient id={`cov-${title.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={getCoverStop(cover, 0)} />
          <stop offset="100%" stopColor={getCoverStop(cover, 1)} />
        </linearGradient>
      </defs>
      <rect width="280" height="48" fill={`url(#cov-${title.replace(/\s/g, '')})`} opacity={0.88} />

      {/* Emoji */}
      <text x="24" y="76" fontSize={24} dominantBaseline="middle">{emoji}</text>

      {/* Title */}
      <text x="24" y="98" fontSize={13} fontWeight="700" fill={S.title} fontFamily="ui-sans-serif,Arial,sans-serif"
            style={{ letterSpacing: '-0.3px' }}>
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
    <TL x={24} y={107} w={110} h={3} c={S.muted} r={1} />
    <HR x={24} y={116} w={232} />
    <TH x={24} y={122} w={60} c={S.title} />
    <Num x={24} y={132} w={140} n={1} c={S.blue} />
    <Num x={24} y={141} w={120} n={2} c={S.blue} />
    <HR x={24} y={151} w={232} />
    <CR x={180} y={108} w={70} done />
    <CR x={180} y={120} w={55} />
    <CR x={180} y={132} w={62} />
  </PageScreenshot>
);

export const ProjectBriefThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#4facfe,#00f2fe)" emoji="🚀" title="Project Brief">
    {/* Callout */}
    <rect x={24} y={107} width={232} height={14} rx={3} fill="#fff3cd" />
    <TL x={30} y={111} w={170} h={3} c={S.yellow} r={1} />
    <TH x={24} y={126} w={50} />
    <Bl x={24} y={135} w={150} />
    <Bl x={24} y={144} w={130} />
    {/* Timeline bar */}
    <rect x={130} y={107} width={126} height={8} rx={4} fill={S.line} />
    <rect x={130} y={107} width={70} height={8} rx={4} fill={S.blue} opacity={0.45} />
    <TL x={130} y={118} w={40} h={2} c={S.faint} r={1} />
    <TL x={176} y={118} w={40} h={2} c={S.faint} r={1} />
  </PageScreenshot>
);

export const WeeklyReviewThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#43e97b,#38f9d7)" emoji="🗓️" title="Weekly Review">
    <TH x={24} y={107} w={44} c={S.green} />
    <TH x={148} y={107} w={44} c={S.red} />
    <Bl x={24} y={117} w={100} c={S.green} />
    <Bl x={24} y={126} w={90} c={S.green} />
    <Bl x={148} y={117} w={90} c={S.red} />
    <Bl x={148} y={126} w={80} c={S.red} />
    <HR x={24} y={137} w={232} />
    <TH x={24} y={143} w={80} />
    <CR x={24} y={151} w={100} done />
    <CR x={140} y={151} w={90} />
  </PageScreenshot>
);

export const OneonOneThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#fa709a,#fee140)" emoji="🤝" title="1:1 Meeting">
    <TH x={24} y={107} w={50} />
    <TL x={24} y={117} w={200} c={S.faint} />
    <TL x={24} y={124} w={160} c={S.faint} />
    <HR x={24} y={133} w={232} />
    <TH x={24} y={139} w={80} c={S.blue} />
    <CR x={24} y={149} w={150} done />
    <CR x={24} y={158} w={130} />  {/* extends past, clipped by viewBox */}
  </PageScreenshot>
);

export const DailyJournalThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#f6d365,#fda085)" emoji="✍️" title="Daily Journal">
    {/* Mood row */}
    {['😄','🙂','😐','😔'].map((e, i) => (
      <text key={i} x={24 + i * 18} y={118} fontSize={11} opacity={i === 0 ? 1 : 0.3}>{e}</text>
    ))}
    <HR x={24} y={124} w={232} />
    <TH x={24} y={130} w={56} c={S.orange} />
    <TL x={24} y={139} w={200} c={S.faint} />
    <TL x={24} y={147} w={180} c={S.faint} />
    <CR x={24} y={154} w={140} done />
  </PageScreenshot>
);

export const ReadingNotesThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#a18cd1,#fbc2eb)" emoji="📚" title="Reading Notes">
    <TH x={24} y={107} w={90} />
    <TL x={24} y={116} w={200} c={S.faint} />
    {/* Quote block */}
    <rect x={24} y={125} width={3} height={22} rx={1.5} fill={S.purple} />
    <TL x={32} y={128} w={180} c={S.muted} r={1} />
    <TL x={32} y={136} w={160} c={S.muted} r={1} />
    <TL x={32} y={144} w={100} c={S.muted} r={1} />
    <TH x={24} y={153} w={64} />
  </PageScreenshot>
);

export const TravelPlannerThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#89f7fe,#66a6ff)" emoji="✈️" title="Travel Planner">
    <TL x={24} y={107} w={200} c={S.faint} />
    {/* 3 day cards */}
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={24 + i * 72} y={113} width={66} height={36} rx={3} fill="#f0f0f0" />
        <TL x={32 + i * 72} y={120} w={50} h={5} c={S.blue} r={1} />
        <CR x={32 + i * 72} y={129} w={40} done={i < 2} />
        <CR x={32 + i * 72} y={139} w={36} />
      </g>
    ))}
    <TH x={24} y={155} w={52} />
  </PageScreenshot>
);

export const StudyNotesThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#d4fc79,#96e6a1)" emoji="🎓" title="Study Notes">
    <TH x={24} y={107} w={80} c={S.green} />
    <Bl x={24} y={117} w={160} c={S.green} />
    <Bl x={24} y={126} w={140} c={S.green} />
    {/* Concept box */}
    <rect x={24} y={135} width={232} height={16} rx={3} fill="#dbeddb" />
    <TL x={32} y={140} w={100} h={5} c={S.green} r={1} />
    <TL x={140} y={140} w={80} h={5} c={S.faint} r={1} />
    <TH x={24} y={156} w={64} />
  </PageScreenshot>
);

export const BugReportThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#c4403d,#eb5757)" emoji="🐛" title="Bug Report">
    {/* Severity badges */}
    <Badge x={24} y={107} w={38} bg={S.red} label="Critical" />
    <Badge x={68} y={107} w={30} bg={S.orange} label="High" />
    <Badge x={104} y={107} w={34} bg={S.yellow} label="Medium" />
    <TH x={24} y={121} w={68} />
    <TL x={24} y={130} w={200} c={S.faint} />
    <TL x={24} y={138} w={170} c={S.faint} />
    <HR x={24} y={147} w={232} />
    <Num x={24} y={152} w={120} n={1} c={S.red} />
    <Num x={160} y={152} w={90} n={2} c={S.red} />
  </PageScreenshot>
);

export const OKRsThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#fddb92,#d1fdff)" emoji="🎯" title="OKRs">
    {[
      { label: 'Objective 1', color: S.yellow, bg: '#fdecc8' },
      { label: 'Objective 2', color: S.green,  bg: '#dbeddb' },
      { label: 'Objective 3', color: S.blue,   bg: '#d3e5ef' },
    ].map(({ color, bg }, i) => (
      <g key={i}>
        <rect x={24} y={107 + i * 18} width={232} height={14} rx={3} fill={bg} />
        <TL x={32} y={112 + i * 18} w={70} h={5} c={color} r={1} />
        <CR x={150} y={111 + i * 18} w={60} done={i === 0} />
        <CR x={196} y={111 + i * 18} w={40} done={i < 2} />
      </g>
    ))}
    <HR x={24} y={161} w={232} />
  </PageScreenshot>
);

export const ProductSpecThumb = () => (
  <PageScreenshot cover="linear-gradient(135deg,#89dceb,#66a6ff)" emoji="📐" title="Product Spec">
    <TH x={24} y={107} w={80} />
    <TL x={24} y={116} w={200} c={S.faint} />
    <TL x={24} y={123} w={170} c={S.faint} />
    <HR x={24} y={131} w={232} />
    <TH x={24} y={137} w={64} c={S.blue} />
    <Bl x={24} y={146} w={170} c={S.blue} />
    <Bl x={24} y={155} w={150} c={S.blue} />
    <CR x={180} y={137} w={60} done />
    <CR x={180} y={149} w={55} done />
    <CR x={180} y={161} w={50} />
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
