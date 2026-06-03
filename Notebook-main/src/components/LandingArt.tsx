/**
 * Self-contained SVG product imagery for the landing page.
 * No external image files — everything is vector, themeable, and crisp at any size.
 */

// ── Google "G" mark (for the sign-in button) ────────────────────────────────
export const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ── Big app mockup (hero) — a mini render of the actual app in a browser frame ─
export const AppMockup = () => (
  <svg viewBox="0 0 640 420" xmlns="http://www.w3.org/2000/svg" className="landing-mockup-svg">
    <defs>
      <linearGradient id="cov" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#667eea" /><stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
      <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#1f1d1a" floodOpacity="0.18" />
      </filter>
    </defs>

    {/* Window */}
    <g filter="url(#ds)">
      <rect x="20" y="14" width="600" height="392" rx="14" fill="#ffffff" />
      {/* Title bar */}
      <rect x="20" y="14" width="600" height="34" rx="14" fill="#f7f7f5" />
      <rect x="20" y="34" width="600" height="14" fill="#f7f7f5" />
      <circle cx="42" cy="31" r="5" fill="#ff5f57" />
      <circle cx="60" cy="31" r="5" fill="#febc2e" />
      <circle cx="78" cy="31" r="5" fill="#28c840" />
      <rect x="240" y="25" width="180" height="12" rx="6" fill="#e9e9e7" />

      {/* Sidebar */}
      <rect x="20" y="48" width="150" height="358" fill="#f7f7f5" />
      <rect x="34" y="64" width="20" height="8" rx="2" fill="#cfcdc8" />
      <rect x="60" y="64" width="70" height="8" rx="2" fill="#37352f" opacity="0.7" />
      {[96, 116, 136].map((y, i) => (
        <g key={i}><rect x="34" y={y} width="10" height="8" rx="2" fill="#cfcdc8" /><rect x="50" y={y} width={90 - i * 14} height="8" rx="2" fill="#cfcdc8" /></g>
      ))}
      <rect x="34" y="166" width="40" height="7" rx="2" fill="#b9b7b1" />
      {[186, 206, 226, 246].map((y, i) => (
        <g key={i}><rect x="40" y={y} width="9" height="9" rx="2" fill={i === 1 ? '#2383e2' : '#d6d4cf'} opacity={i === 1 ? 0.25 : 1} /><rect x="56" y={y + 1} width={86 - i * 8} height="7" rx="2" fill={i === 1 ? '#37352f' : '#cfcdc8'} opacity={i === 1 ? 0.8 : 1} /></g>
      ))}
      <rect x="34" y="300" width="60" height="7" rx="2" fill="#b9b7b1" />
      <rect x="34" y="372" width="120" height="20" rx="5" fill="#2383e2" opacity="0.12" />
      <rect x="44" y="378" width="60" height="8" rx="2" fill="#2383e2" opacity="0.6" />

      {/* Cover */}
      <rect x="170" y="48" width="450" height="70" fill="url(#cov)" />
      {/* Page emoji + title */}
      <circle cx="210" cy="118" r="20" fill="#fff" />
      <text x="210" y="126" textAnchor="middle" fontSize="22">🚀</text>
      <rect x="196" y="146" width="220" height="16" rx="4" fill="#37352f" opacity="0.85" />

      {/* Body blocks */}
      <rect x="196" y="180" width="380" height="8" rx="3" fill="#d6d4cf" />
      <rect x="196" y="196" width="320" height="8" rx="3" fill="#e3e1dc" />
      {/* checklist */}
      {[222, 240, 258].map((y, i) => (
        <g key={i}>
          <rect x="196" y={y} width="11" height="11" rx="2.5" fill={i < 2 ? '#2383e2' : 'none'} stroke={i < 2 ? '#2383e2' : '#c7c6c3'} strokeWidth="1.4" />
          {i < 2 && <path d={`M199 ${y + 5.5} l2.5 2.5 l4 -4`} stroke="#fff" strokeWidth="1.4" fill="none" />}
          <rect x="216" y={y + 2} width={260 - i * 30} height="7" rx="2" fill="#d6d4cf" />
        </g>
      ))}
      {/* callout */}
      <rect x="196" y="286" width="380" height="40" rx="6" fill="#f1f1ef" />
      <text x="212" y="311" fontSize="15">💡</text>
      <rect x="232" y="298" width="320" height="7" rx="2" fill="#cbc9c4" />
      <rect x="232" y="312" width="260" height="7" rx="2" fill="#dcdad5" />
      {/* mini board */}
      <rect x="196" y="342" width="118" height="48" rx="6" fill="#fff" stroke="#e9e9e7" />
      <rect x="206" y="350" width="44" height="9" rx="4" fill="#d3e5ef" />
      <rect x="206" y="366" width="90" height="6" rx="2" fill="#e3e1dc" />
      <rect x="206" y="378" width="70" height="6" rx="2" fill="#e3e1dc" />
      <rect x="328" y="342" width="118" height="48" rx="6" fill="#fff" stroke="#e9e9e7" />
      <rect x="338" y="350" width="44" height="9" rx="4" fill="#dbeddb" />
      <rect x="338" y="366" width="90" height="6" rx="2" fill="#e3e1dc" />
      <rect x="460" y="342" width="116" height="48" rx="6" fill="#fff" stroke="#e9e9e7" />
      <rect x="470" y="350" width="44" height="9" rx="4" fill="#fdecc8" />
      <rect x="470" y="366" width="86" height="6" rx="2" fill="#e3e1dc" />
    </g>
  </svg>
);

// ── Feature illustrations ────────────────────────────────────────────────────

const Frame = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
  <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect width="200" height="130" rx="10" fill={bg} />
    {children}
  </svg>
);

export const EditorArt = () => (
  <Frame bg="#eef2ff">
    <rect x="24" y="22" width="80" height="9" rx="3" fill="#4f46e5" opacity="0.8" />
    <rect x="24" y="42" width="152" height="6" rx="3" fill="#c7d2fe" />
    <rect x="24" y="54" width="120" height="6" rx="3" fill="#dbe3fe" />
    {[72, 88, 104].map((y, i) => (
      <g key={i}><circle cx="28" cy={y + 3} r="3" fill="#818cf8" /><rect x="38" y={y} width={130 - i * 18} height="6" rx="3" fill="#c7d2fe" /></g>
    ))}
  </Frame>
);

export const DatabaseArt = () => (
  <Frame bg="#ecfdf5">
    {[0, 1, 2, 3].map((r) => (
      <g key={r}>
        {[0, 1, 2].map((c) => (
          <rect key={c} x={20 + c * 56} y={26 + r * 22} width="50" height="16" rx="3"
            fill={r === 0 ? '#10b981' : '#fff'} opacity={r === 0 ? 0.85 : 1} stroke="#a7f3d0" />
        ))}
      </g>
    ))}
  </Frame>
);

export const CalendarArt = () => (
  <Frame bg="#fff7ed">
    <rect x="22" y="20" width="156" height="14" rx="4" fill="#fb923c" opacity="0.8" />
    {Array.from({ length: 20 }).map((_, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const has = [2, 6, 9, 13, 16].includes(i);
      return <rect key={i} x={22 + col * 32} y={40 + row * 20} width="28" height="16" rx="3"
        fill={has ? '#fdba74' : '#fff'} stroke="#fed7aa" />;
    })}
  </Frame>
);

export const VaultArt = () => (
  <Frame bg="#eff6ff">
    <rect x="74" y="40" width="52" height="42" rx="6" fill="#3b82f6" />
    <path d="M84 40 v-8 a16 16 0 0 1 32 0 v8" fill="none" stroke="#3b82f6" strokeWidth="6" />
    <circle cx="100" cy="58" r="6" fill="#fff" />
    <rect x="97" y="60" width="6" height="12" rx="2" fill="#fff" />
    <rect x="40" y="98" width="120" height="6" rx="3" fill="#bfdbfe" />
    <rect x="60" y="110" width="80" height="6" rx="3" fill="#dbeafe" />
  </Frame>
);

export const AiArt = () => (
  <Frame bg="#faf5ff">
    <path d="M100 30 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 z" fill="#a855f7" />
    <circle cx="150" cy="40" r="5" fill="#c084fc" />
    <circle cx="56" cy="92" r="4" fill="#d8b4fe" />
    <rect x="44" y="104" width="112" height="6" rx="3" fill="#e9d5ff" />
    <rect x="64" y="116" width="72" height="6" rx="3" fill="#f3e8ff" />
  </Frame>
);

export const TemplatesArt = () => (
  <Frame bg="#fdf2f8">
    {[0, 1, 2].map((c) => (
      <g key={c}>
        <rect x={22 + c * 56} y="24" width="50" height="34" rx="5" fill="#fff" stroke="#fbcfe8" />
        <rect x={22 + c * 56} y="24" width="50" height="12" rx="5" fill={['#f9a8d4', '#c4b5fd', '#93c5fd'][c]} />
        <rect x={28 + c * 56} y="64" width="38" height="5" rx="2" fill="#fbcfe8" />
        <rect x={28 + c * 56} y="74" width="30" height="5" rx="2" fill="#fce7f3" />
      </g>
    ))}
    {[0, 1, 2].map((c) => (
      <rect key={c} x={22 + c * 56} y="92" width="50" height="26" rx="5" fill="#fff" stroke="#fbcfe8" />
    ))}
  </Frame>
);

// ── Small brand logo ─────────────────────────────────────────────────────────
export const BrandLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#2383e2" />
    <rect x="8" y="8" width="16" height="3" rx="1.5" fill="#fff" />
    <rect x="8" y="14.5" width="16" height="3" rx="1.5" fill="#fff" opacity="0.8" />
    <rect x="8" y="21" width="10" height="3" rx="1.5" fill="#fff" opacity="0.6" />
  </svg>
);
