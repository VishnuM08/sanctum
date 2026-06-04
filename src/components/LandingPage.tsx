import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { Capacitor } from '@capacitor/core';
import { api } from '../utils/api';
import {
  GoogleIcon, AppMockup, BrandLogo,
  EditorArt, DatabaseArt, CalendarArt, VaultArt, AiArt, TemplatesArt,
} from './LandingArt';
import {
  PenLine, Database, CalendarDays, ShieldCheck, Sparkles,
  LayoutTemplate, Check, ArrowRight, Settings, X, Wifi, RefreshCw
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
  const emailLogin = useStore((s) => s.emailLogin);
  const verifyOtp = useStore((s) => s.verifyOtp);
  const emailRegister = useStore((s) => s.emailRegister);

  const [signingIn, setSigningIn] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Unified Auth state
  const [authMethod, setAuthMethod] = useState<'google' | 'vault'>('google');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [otpStep, setOtpStep] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Server connection configuration state
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [serverStatusDetails, setServerStatusDetails] = useState('');

  const handleOpenServerModal = () => {
    setServerUrl(api.getApiBase());
    setServerStatus('idle');
    setServerStatusDetails('');
    setShowServerModal(true);
  };

  const handleTestConnection = async () => {
    setServerStatus('checking');
    setServerStatusDetails('Attempting to connect...');
    
    // Temporarily save base URL to api to test it (without writing to localStorage)
    const originalBase = api.getApiBase();
    
    try {
      let formattedUrl = serverUrl.trim();
      if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'http://' + formattedUrl;
      }
      
      api.setApiBase(formattedUrl);
      const isOnline = await api.checkServer();
      
      if (isOnline) {
        setServerStatus('online');
        setServerStatusDetails('Connection successful! Server is online and responding.');
      } else {
        setServerStatus('offline');
        setServerStatusDetails('Failed to connect. Please check URL, server port, or network firewall.');
      }
    } catch (err) {
      setServerStatus('offline');
      setServerStatusDetails('Error connecting: ' + (err as Error).message);
    } finally {
      // Revert base URL so we don't accidentally save an untested one unless saved
      api.setApiBase(originalBase);
    }
  };

  const handleSaveConnection = () => {
    let formattedUrl = serverUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl;
    }
    api.setApiBase(formattedUrl);
    setShowServerModal(false);
  };

  const handleVaultAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please fill in all fields');
        }
        await emailRegister(name.trim(), email.trim(), password);
        setAuthMode('login');
        setAuthError(null);
        alert('Registration successful! Please log in to receive your OTP.');
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please fill in all fields');
        }
        const res = await emailLogin(email.trim(), password);
        if (res?.otpRequired) {
          setOtpStep(true);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (!otpCode.trim() || otpCode.length !== 6) {
        throw new Error('Please enter the 6-digit code');
      }
      await verifyOtp(email.trim(), otpCode.trim());
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const signInRef = useRef(signIn);
  useEffect(() => {
    signInRef.current = signIn;
  }, [signIn]);

  useEffect(() => {
    // On native mobile devices, if no custom server URL has been set,
    // automatically pop open the Server Connection dialog to guide them.
    if (Capacitor.isNativePlatform() && api.getApiBase() === '') {
      handleOpenServerModal();
    }
  }, []);

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
            <span>Sanctum</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="#templates">Templates</a>
          </nav>
          <div id="googleBtnNav" style={{ display: googleReady ? 'block' : 'none' }} />
          {!googleReady && (
            <button className="landing-signin-sm" onClick={() => { setAuthMethod('vault'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={signingIn}>
              Sign in
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

          <div className="landing-auth-card hero-anim" style={{ animationDelay: '400ms' }}>
            <div className="landing-auth-header" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div className="landing-auth-tabs" style={{ flex: 1, margin: 0 }}>
                <button
                  type="button"
                  className={`landing-auth-tab ${authMethod === 'google' ? 'active' : ''}`}
                  onClick={() => { setAuthMethod('google'); setAuthError(null); setOtpStep(false); }}
                >
                  Google Login
                </button>
                <button
                  type="button"
                  className={`landing-auth-tab ${authMethod === 'vault' ? 'active' : ''}`}
                  onClick={() => { setAuthMethod('vault'); setAuthError(null); }}
                >
                  Vault Account
                </button>
              </div>
              <button
                type="button"
                className="server-config-btn"
                onClick={handleOpenServerModal}
                title="Configure Backend Server URL"
              >
                <Settings size={18} />
              </button>
            </div>

            {authError && (
              <div className="landing-auth-error">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            {authMethod === 'google' ? (
              <div className="landing-cta" style={{ margin: 0, width: '100%' }}>
                <div id="googleBtnHero" style={{ display: googleReady ? 'block' : 'none', height: 40, width: '100%' }} />
                {!googleReady && (
                  <button className="google-btn" style={{ width: '100%' }} onClick={doGoogleSignIn} disabled={signingIn}>
                    {signingIn ? (
                      <><span className="google-spinner" /> Signing in…</>
                    ) : (
                      <><GoogleIcon size={18} /> Continue with Google</>
                    )}
                  </button>
                )}
                <span className="landing-cta-note" style={{ textAlign: 'center', width: '100%' }}>
                  Sign in securely with Google to access your workspace
                </span>
              </div>
            ) : otpStep ? (
              <form onSubmit={handleOtpVerifySubmit} className="otp-container">
                <div className="otp-description">
                  A 6-digit verification code has been sent to <strong>{email}</strong>.
                  <br />
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    (Check your container console logs if unconfigured)
                  </span>
                </div>
                <div className="landing-auth-field">
                  <label className="landing-auth-label">Verification Code</label>
                  <input
                    type="text"
                    className="landing-auth-input otp-code-input"
                    placeholder="000000"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    disabled={authLoading}
                    autoFocus
                  />
                </div>
                <button type="submit" className="landing-auth-btn" disabled={authLoading || otpCode.length !== 6}>
                  {authLoading ? (
                    <><span className="google-spinner" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> Verifying…</>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
                <button
                  type="button"
                  className="landing-auth-link"
                  onClick={() => { setOtpStep(false); setOtpCode(''); setAuthError(null); }}
                >
                  ← Back to login
                </button>
              </form>
            ) : (
              <form onSubmit={handleVaultAuthSubmit} className="vault-auth-form">
                {authMode === 'register' && (
                  <div className="landing-auth-field">
                    <label className="landing-auth-label">Full Name</label>
                    <input
                      type="text"
                      className="landing-auth-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                  </div>
                )}
                <div className="landing-auth-field">
                  <label className="landing-auth-label">Email Address</label>
                  <input
                    type="email"
                    className="landing-auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={authLoading}
                    required
                  />
                </div>
                <div className="landing-auth-field">
                  <label className="landing-auth-label">Password</label>
                  <input
                    type="password"
                    className="landing-auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={authLoading}
                    required
                  />
                </div>

                <button type="submit" className="landing-auth-btn" disabled={authLoading}>
                  {authLoading ? (
                    <><span className="google-spinner" style={{ borderColor: 'transparent', borderTopColor: '#fff' }} /> Loading…</>
                  ) : authMode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>

                <button
                  type="button"
                  className="landing-auth-link"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError(null);
                  }}
                >
                  {authMode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Log in'}
                </button>
              </form>
            )}
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
        <div className="landing-brand"><BrandLogo size={22} /><span>Sanctum</span></div>
        <span className="landing-footer-note">Sanctum · Secure AI-Powered Organizer</span>
      </footer>

      {showServerModal && (
        <div className="server-modal-overlay" onClick={() => setShowServerModal(false)}>
          <div className="server-modal" onClick={(e) => e.stopPropagation()}>
            <div className="server-modal-header">
              <h3 className="server-modal-title">Server Connection</h3>
              <button className="server-modal-close" onClick={() => setShowServerModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="server-modal-body">
              <div className="server-input-group">
                <label className="server-input-label">Backend API Server URL</label>
                <div className="server-input-wrapper">
                  <input
                    type="text"
                    className="server-url-input"
                    placeholder={Capacitor.isNativePlatform() ? "e.g., http://192.168.1.50:8080/api" : "e.g., http://localhost:8080/api"}
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                  />
                </div>
                {Capacitor.isNativePlatform() && serverUrl.trim() === '' && (
                  <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                    ⚠️ On mobile devices, a custom backend IP/domain is required to sync data with your Ubuntu server.
                  </span>
                )}
              </div>

              {(serverStatus !== 'idle' || api.getApiBase()) && (
                <div className="server-status-indicator">
                  <div className={`status-indicator-dot ${
                    serverStatus === 'checking' ? 'status-dot-checking' :
                    serverStatus === 'online' ? 'status-dot-online' :
                    serverStatus === 'offline' ? 'status-dot-offline' :
                    'status-dot-online'
                  }`} />
                  <div className="server-status-text">
                    <span className="server-status-label">Connection Status</span>
                    <span className="server-status-value">
                      {serverStatus === 'checking' ? 'Testing connection...' :
                       serverStatus === 'online' ? 'Online' :
                       serverStatus === 'offline' ? 'Offline / Unreachable' :
                       'Configured'}
                    </span>
                    {serverStatusDetails && (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {serverStatusDetails}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="server-action-row">
                <button
                  type="button"
                  className="server-modal-btn server-btn-secondary"
                  onClick={handleTestConnection}
                  disabled={serverStatus === 'checking'}
                >
                  {serverStatus === 'checking' ? (
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Wifi size={14} />
                  )}
                  Test Connection
                </button>
                <button
                  type="button"
                  className="server-modal-btn server-btn-primary"
                  onClick={handleSaveConnection}
                >
                  Save Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
