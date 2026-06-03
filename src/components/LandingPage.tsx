import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import {
  GoogleIcon, AppMockup, BrandLogo,
  EditorArt, DatabaseArt, CalendarArt, VaultArt, AiArt, TemplatesArt,
} from './LandingArt';
import {
  PenLine, Database, CalendarDays, ShieldCheck, Sparkles,
  LayoutTemplate, Check, ArrowRight,
} from 'lucide-react';

// ── Scroll-reveal wrapper (IntersectionObserver) ─────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: <PenLine size={18} />,        art: <EditorArt />,    title: 'Block editor', desc: 'A fast, Notion-style editor with slash commands, 14 block types, drag-to-reorder, and inline AI.' },
  { icon: <Database size={18} />,       art: <DatabaseArt />,  title: 'Databases',    desc: 'Table, Board, Gallery, List and Calendar views with filters, sorts and inline editing.' },
  { icon: <CalendarDays size={18} />,   art: <CalendarArt />,  title: 'Calendar',     desc: 'A workspace-wide calendar that pulls every dated item from all your databases into one view.' },
  { icon: <ShieldCheck size={18} />,    art: <VaultArt />,     title: 'Encrypted Vault', desc: 'Store passwords with real AES-256-GCM encryption. Your master key never leaves your device.' },
  { icon: <Sparkles size={18} />,       art: <AiArt />,        title: 'AI assistant', desc: 'Summarize pages, extract tasks, and draft content with Claude — right inside the editor.' },
  { icon: <LayoutTemplate size={18} />, art: <TemplatesArt />, title: '36 templates', desc: 'Work, school, life and project templates — one click to a fully structured page.' },
];

export function LandingPage() {
  const signIn = useStore((s) => s.signIn);
  const [signingIn, setSigningIn] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const signInRef = useRef(signIn);
  useEffect(() => {
    signInRef.current = signIn;
  }, [signIn]);

  const handleGoogleLogin = async (response: any) => {
    setSigningIn(true);
    try {
      const idToken = response.credential;
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      
      const name = payload.name || payload.email.split('@')[0];
      const email = payload.email;
      const avatar = payload.picture || '🧑‍💻';

      signInRef.current({ name, email, avatar }, idToken);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Fallback to simulated sign-in
      signInRef.current({ name: 'Vishnu', email: 'vishnu.magesh@gmail.com', avatar: '🧑‍💻' });
    } finally {
      setSigningIn(false);
    }
  };

  const doGoogleSignIn = () => {
    setSigningIn(true);
    // Simulated sign-in — no real OAuth. Drops you straight into the app.
    setTimeout(() => {
      signInRef.current({ name: 'Vishnu', email: 'vishnu.magesh@gmail.com', avatar: '🧑‍💻' });
    }, 850);
  };

  useEffect(() => {
    let checkInterval: any;
    let attempts = 0;

    const initGoogle = () => {
      const google = (window as any).google;
      if (typeof window !== 'undefined' && google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: '335592680836-vgpg4tlh2rip0ij37qq2ao4o2sm3tesc.apps.googleusercontent.com',
            callback: handleGoogleLogin,
          });

          // Render Nav button if container exists
          const navBtnEl = document.getElementById('googleBtnNav');
          if (navBtnEl) {
            navBtnEl.innerHTML = '';
            google.accounts.id.renderButton(navBtnEl, {
              theme: 'outline',
              size: 'medium',
              shape: 'pill',
              text: 'signin',
            });
          }

          // Render Hero button if container exists
          const heroBtnEl = document.getElementById('googleBtnHero');
          if (heroBtnEl) {
            heroBtnEl.innerHTML = '';
            google.accounts.id.renderButton(heroBtnEl, {
              theme: 'filled_blue',
              size: 'large',
              shape: 'pill',
              text: 'continue_with',
              width: 250,
            });
          }

          // Render Final CTA button if container exists
          const finalBtnEl = document.getElementById('googleBtnFinal');
          if (finalBtnEl) {
            finalBtnEl.innerHTML = '';
            google.accounts.id.renderButton(finalBtnEl, {
              theme: 'outline',
              size: 'large',
              shape: 'pill',
              text: 'continue_with',
              width: 250,
            });
          }

          // Prompt One Tap
          google.accounts.id.prompt();

          setGoogleReady(true);
          return true;
        } catch (e) {
          console.warn('Failed to load Google identity rendering:', e);
        }
      }
      return false;
    };

    const initialized = initGoogle();
    if (!initialized) {
      checkInterval = setInterval(() => {
        attempts++;
        const initializedNow = initGoogle();
        if (initializedNow || attempts >= 20) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="landing">
      {/* Animated gradient backdrop */}
      <div className="landing-bg" aria-hidden />

      {/* Nav */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <BrandLogo size={28} />
            <span>Notebook</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#templates">Templates</a>
          </nav>
          <div id="googleBtnNav" style={{ display: googleReady ? 'block' : 'none' }} />
          {!googleReady && (
            <button className="landing-signin-sm" onClick={doGoogleSignIn} disabled={signingIn}>
              <GoogleIcon size={16} /> Sign in
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div className="landing-badge hero-anim" style={{ animationDelay: '40ms' }}>
            <Sparkles size={13} /> Your all-in-one workspace
          </div>
          <h1 className="landing-h1">
            <span className="hero-anim" style={{ animationDelay: '90ms' }}>Write, plan and</span>{' '}
            <span className="hero-anim landing-grad" style={{ animationDelay: '160ms' }}>organize</span>{' '}
            <span className="hero-anim" style={{ animationDelay: '230ms' }}>— all in one place.</span>
          </h1>
          <p className="landing-sub hero-anim" style={{ animationDelay: '320ms' }}>
            Notes, databases, calendar, an encrypted vault and an AI assistant.
            One beautiful, fast workspace that works the way you think.
          </p>

          <div className="landing-cta hero-anim" style={{ animationDelay: '400ms' }}>
            <div id="googleBtnHero" style={{ display: googleReady ? 'block' : 'none', height: 40 }} />
            {!googleReady && (
              <button className="google-btn" onClick={doGoogleSignIn} disabled={signingIn}>
                {signingIn ? (
                  <><span className="google-spinner" /> Signing in…</>
                ) : (
                  <><GoogleIcon size={18} /> Continue with Google</>
                )}
              </button>
            )}
            <span className="landing-cta-note">Prototype — simulated sign-in, no account needed</span>
          </div>

          <div className="landing-trust hero-anim" style={{ animationDelay: '480ms' }}>
            {['No setup', 'Works offline', 'Free forever'].map((t) => (
              <span key={t}><Check size={14} /> {t}</span>
            ))}
          </div>
        </div>

        <div className="landing-hero-art hero-anim" style={{ animationDelay: '300ms' }}>
          <div className="landing-mockup-glow" aria-hidden />
          <div className="landing-mockup-float">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <Reveal><h2 className="landing-h2">Everything you need, nothing you don't</h2></Reveal>
        <Reveal delay={80}><p className="landing-section-sub">Six powerful tools that work together seamlessly.</p></Reveal>
        <div className="landing-feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} className="landing-feature-card-wrap">
              <div className="landing-feature-card">
                <div className="landing-feature-art">{f.art}</div>
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Showcase band */}
      <section id="templates" className="landing-showcase">
        <Reveal className="landing-showcase-text">
          <div className="landing-badge"><LayoutTemplate size={13} /> Templates</div>
          <h2 className="landing-h2">Start in seconds, not hours</h2>
          <p className="landing-section-sub" style={{ textAlign: 'left', margin: '12px 0 20px' }}>
            36 ready-made templates across Work, School, Life and Project Management —
            from Sprint Boards and OKRs to Habit Trackers and Meal Planners.
          </p>
          <ul className="landing-checklist">
            {['Meeting notes & 1:1s', 'Sprint boards & roadmaps', 'Budgets & habit trackers', 'Study planners & journals'].map((t) => (
              <li key={t}><Check size={15} /> {t}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120} className="landing-showcase-art">
          <div className="landing-mockup-float-slow"><AppMockup /></div>
        </Reveal>
      </section>

      {/* Security */}
      <section id="security" className="landing-security">
        <Reveal className="landing-security-inner">
          <div className="landing-security-icon"><ShieldCheck size={30} /></div>
          <h2 className="landing-h2">Your secrets stay yours</h2>
          <p className="landing-section-sub">
            The built-in vault uses real <strong>AES-256-GCM</strong> encryption with a key derived
            from your master password via PBKDF2. The key lives only in memory and is never stored —
            not even we could read your data.
          </p>
          <div className="landing-security-pills">
            {['AES-256-GCM', 'PBKDF2 · 210k iterations', 'Zero plaintext at rest', 'Auto-lock'].map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="landing-final">
        <Reveal>
          <h2 className="landing-h2" style={{ color: '#fff' }}>Ready to get organized?</h2>
          <p className="landing-final-sub">Jump in — it takes one click.</p>
          <div style={{ display: googleReady ? 'inline-flex' : 'none', justifyContent: 'center', height: 40 }}>
            <div id="googleBtnFinal" />
          </div>
          {!googleReady && (
            <button className="google-btn light" onClick={doGoogleSignIn} disabled={signingIn}>
              {signingIn ? <><span className="google-spinner dark" /> Signing in…</> : <><GoogleIcon size={18} /> Continue with Google <ArrowRight size={16} /></>}
            </button>
          )}
        </Reveal>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand"><BrandLogo size={22} /><span>Notebook</span></div>
        <span className="landing-footer-note">A frontend prototype · built with React + TipTap</span>
      </footer>
    </div>
  );
}
