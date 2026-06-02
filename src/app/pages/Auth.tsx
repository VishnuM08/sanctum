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
              { theme: 'outline', size: 'large', width: 380 }
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Animated Glimmers in Background */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute -bottom-8 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <Card className="w-full max-w-md p-8 border border-border/80 bg-card/60 backdrop-blur-xl relative z-10 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <img 
            src={sanctumLogo} 
            alt="Sanctum Logo" 
            className="w-16 h-16 rounded-2xl shadow-xl shadow-primary/20 object-cover mb-4 animate-in bounce-in" 
          />
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Sanctum
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? 'Securely access your notes & sensitive numbers' : 'Create your private encrypted vault'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative">
              <UserIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-sm glass-input"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-sm glass-input"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none text-sm glass-input"
              required
            />
          </div>

          <Button type="submit" className="w-full py-3.5 mt-2 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {isLogin && (
          <>
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute px-3 bg-[#ffffff] dark:bg-[#242426] text-[10px] uppercase font-bold tracking-wider text-muted-foreground z-10">
                <span>or connect via</span>
              </div>
              <div className="w-full border-t border-border" />
            </div>

            <div className="flex flex-col gap-3">
              <div id="googleBtn" className="w-full flex justify-center h-10 overflow-hidden rounded-xl" />
            </div>
          </>
        )}

        <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-border/60">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-center text-primary font-semibold hover:underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </Card>
    </div>
  );
}
