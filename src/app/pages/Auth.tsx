import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Shield, Sparkles, Lock, Mail, User as UserIcon, WifiOff, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';
import sanctumLogo from '../../assets/sanctum_logo.png';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const googleClientId = '335592680836-vgpg4tlh2rip0ij37qq2ao4o2sm3tesc.apps.googleusercontent.com';

  const handleGoogleLogin = async (response: any) => {
    setLoading(true);
    try {
      const idToken = response.credential;
      await api.googleLogin(idToken);
      toast.success('Logged in with Google!');
      onAuthSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    let checkInterval: any;
    let attempts = 0;

    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google && googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleLogin,
          });

          const btnEl = document.getElementById('googleBtn');
          if (btnEl) {
            btnEl.innerHTML = ''; // Clear previous button to avoid rendering duplicates
            (window as any).google.accounts.id.renderButton(
              btnEl,
              { theme: 'outline', size: 'large', width: 336 }
            );
          }
          return true;
        } catch (e) {
          console.warn('Failed to load Google identity rendering:', e);
        }
      }
      return false;
    };

    // Try immediately
    const initialized = initGoogle();

    // If not ready, poll for it
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
  }, [googleClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Log in
        await api.login(formData.email, formData.password);
        toast.success('Logged in successfully!');
        onAuthSuccess();
      } else {
        // Sign up
        if (!formData.name.trim()) {
          toast.error('Please provide a name');
          setLoading(false);
          return;
        }
        await api.register(formData.name, formData.email, formData.password);
        toast.success('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
      <div className="w-full max-w-[400px] p-8 border border-border bg-card rounded shadow-sm relative z-10 animate-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src={sanctumLogo} 
            alt="Sanctum Logo" 
            className="w-12 h-12 object-cover mb-4 select-none" 
          />
          <h2 className="text-2xl font-bold text-foreground">
            Sanctum
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            {isLogin ? 'Log in to your private workspace' : 'Create your private encrypted vault'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded bg-input-background focus:outline-none focus:border-primary text-sm transition-all"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email..."
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-input-background focus:outline-none focus:border-primary text-sm transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password..."
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-input-background focus:outline-none focus:border-primary text-sm transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-2 px-4 mt-2 bg-foreground text-background hover:bg-foreground/90 font-medium rounded transition-all text-sm cursor-pointer flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {isLogin && (
          <>
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute px-3 bg-background text-[10px] uppercase font-bold tracking-wider text-muted-foreground z-10 select-none">
                or connect via
              </div>
              <div className="w-full border-t border-border" />
            </div>

            <div className="flex flex-col gap-3">
              <div id="googleBtn" className="w-full flex justify-center h-10 overflow-hidden rounded" />
            </div>
          </>
        )}

        <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-border/60">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-center text-muted-foreground hover:text-foreground font-medium hover:underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
